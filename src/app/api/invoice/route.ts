import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// GET /api/invoice - Generate invoice for a customer in a date range
// Optional query params: kdvRate (default 20), dueDays (default 15)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const kdvRateParam = searchParams.get('kdvRate')
    const dueDaysParam = searchParams.get('dueDays')

    if (!customerId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Müşteri, başlangıç ve bitiş tarihi gereklidir' },
        { status: 400 }
      )
    }

    // Parse optional params with defaults
    const kdvRatePercent = kdvRateParam ? parseFloat(kdvRateParam) : 20
    const dueDays = dueDaysParam ? parseInt(dueDaysParam, 10) : 15

    // Validate parsed values
    if (isNaN(kdvRatePercent) || kdvRatePercent < 0 || kdvRatePercent > 100) {
      return NextResponse.json(
        { error: 'Geçersiz KDV oranı (0-100 arası olmalıdır)' },
        { status: 400 }
      )
    }
    if (isNaN(dueDays) || dueDays < 1 || dueDays > 365) {
      return NextResponse.json(
        { error: 'Geçersiz vade süresi (1-365 arası olmalıdır)' },
        { status: 400 }
      )
    }

    // Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id, name, phone, address')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Fetch all daily records for this customer in the date range
    const { data: records, error: recordsError } = await supabase
      .from('DailyRecord')
      .select('*, service:Service(id, name, unit)')
      .eq('customerId', customerId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (recordsError) {
      console.error('Error fetching records for invoice:', recordsError)
      return NextResponse.json(
        { error: 'Fatura oluşturulurken hata oluştu' },
        { status: 500 }
      )
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'Bu tarih aralığında kayıt bulunamadı' },
        { status: 404 }
      )
    }

    // Aggregate line items by service
    const serviceMap: Record<string, {
      serviceId: string
      serviceName: string
      unit: string
      quantity: number
      unitPrice: number
      total: number
    }> = {}

    for (const record of records) {
      if (!serviceMap[record.serviceId]) {
        serviceMap[record.serviceId] = {
          serviceId: record.serviceId,
          serviceName: record.service.name,
          unit: record.service.unit,
          quantity: 0,
          unitPrice: record.unitPrice,
          total: 0,
        }
      }
      serviceMap[record.serviceId].quantity += record.quantity
      serviceMap[record.serviceId].total += record.total
    }

    const lineItems = Object.values(serviceMap).sort((a, b) =>
      a.serviceName.localeCompare(b.serviceName, 'tr')
    )

    // Calculate weighted average unit price for each service
    for (const item of lineItems) {
      if (item.quantity > 0) {
        item.unitPrice = item.total / item.quantity
      }
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const kdvRate = kdvRatePercent / 100
    const kdvAmount = subtotal * kdvRate
    const grandTotal = subtotal + kdvAmount

    // Generate deterministic invoice number based on customerId + date range
    const hashInput = `${customerId}-${startDate}-${endDate}`
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex')
    const sequential = parseInt(hash.substring(0, 4), 16) % 10000
    const invoiceNumber = `FTR-${startDate.replace(/-/g, '')}-${String(sequential).padStart(4, '0')}`

    // Due date: dueDays after end date
    const dueDate = new Date(endDate)
    dueDate.setDate(dueDate.getDate() + dueDays)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const invoice = {
      invoiceNumber,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
      startDate,
      endDate,
      dueDate: dueDateStr,
      lineItems,
      subtotal,
      kdvRate,
      kdvAmount,
      grandTotal,
      createdAt: new Date().toISOString(),
      recordCount: records.length,
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Fatura oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
