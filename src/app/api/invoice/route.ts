import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'

// GET /api/invoice - Generate invoice for a customer in a date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!customerId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Müşteri, başlangıç ve bitiş tarihi gereklidir' },
        { status: 400 }
      )
    }

    // Fetch customer details
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Fetch all daily records for this customer in the date range
    const records = await db.dailyRecord.findMany({
      where: {
        customerId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    })

    if (records.length === 0) {
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
    const kdvRate = 0.20
    const kdvAmount = subtotal * kdvRate
    const grandTotal = subtotal + kdvAmount

    // Generate deterministic invoice number based on customerId + date range
    const hashInput = `${customerId}-${startDate}-${endDate}`
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex')
    const sequential = parseInt(hash.substring(0, 4), 16) % 10000
    const invoiceNumber = `FTR-${startDate.replace(/-/g, '')}-${String(sequential).padStart(4, '0')}`

    // Due date: 15 days after end date
    const dueDate = new Date(endDate)
    dueDate.setDate(dueDate.getDate() + 15)
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
