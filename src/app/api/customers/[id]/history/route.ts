export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/customers/[id]/history - Customer detail with full history and balance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('*')
      .eq('id', id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Fetch prices with service
    const { data: prices, error: pricesError } = await supabase
      .from('CustomerPrice')
      .select('*, service:Service(*)')
      .eq('customerId', id)

    if (pricesError) {
      console.error('Error fetching prices:', pricesError)
      return NextResponse.json(
        { error: 'Müşteri geçmişi yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    // Sort prices by service name
    const sortedPrices = (prices ?? []).sort((a: any, b: any) => {
      const nameA = a.service?.name ?? ''
      const nameB = b.service?.name ?? ''
      return nameA.localeCompare(nameB)
    })

    // Build records query with optional date filters
    let recordsQuery = supabase
      .from('DailyRecord')
      .select('*, service:Service(*)')
      .eq('customerId', id)

    if (startDate) {
      recordsQuery = recordsQuery.gte('date', startDate)
    }
    if (endDate) {
      recordsQuery = recordsQuery.lte('date', endDate)
    }

    const { data: records, error: recordsError } = await recordsQuery
      .order('date', { ascending: false })

    if (recordsError) {
      console.error('Error fetching records:', recordsError)
      return NextResponse.json(
        { error: 'Müşteri geçmişi yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    const allRecords = records ?? []

    // Calculate totals
    const totalBalance = allRecords.reduce((sum: number, r: any) => sum + r.total, 0)
    const recordCount = allRecords.length

    // Service breakdown
    const serviceMap: Record<string, {
      serviceId: string
      serviceName: string
      unit: string
      totalQuantity: number
      totalRevenue: number
    }> = {}

    allRecords.forEach((r: any) => {
      if (!serviceMap[r.serviceId]) {
        serviceMap[r.serviceId] = {
          serviceId: r.serviceId,
          serviceName: r.service?.name ?? 'Bilinmiyor',
          unit: r.service?.unit ?? 'adet',
          totalQuantity: 0,
          totalRevenue: 0,
        }
      }
      serviceMap[r.serviceId].totalQuantity += r.quantity
      serviceMap[r.serviceId].totalRevenue += r.total
    })

    const serviceBreakdown = Object.values(serviceMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Monthly summary
    const monthMap: Record<string, {
      month: string
      totalRevenue: number
      recordCount: number
    }> = {}

    allRecords.forEach((r: any) => {
      const month = r.date.substring(0, 7) // YYYY-MM
      if (!monthMap[month]) {
        monthMap[month] = {
          month,
          totalRevenue: 0,
          recordCount: 0,
        }
      }
      monthMap[month].totalRevenue += r.total
      monthMap[month].recordCount += 1
    })

    const monthlySummary = Object.values(monthMap)
      .sort((a, b) => b.month.localeCompare(a.month))

    // Recent records (last 20)
    const recentRecords = allRecords.slice(0, 20).map((r: any) => ({
      id: r.id,
      date: r.date,
      serviceId: r.serviceId,
      serviceName: r.service?.name ?? 'Bilinmiyor',
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      total: r.total,
      notes: r.notes,
    }))

    // Custom prices
    const customPrices = sortedPrices.map((p: any) => ({
      id: p.id,
      serviceId: p.serviceId,
      serviceName: p.service?.name ?? 'Bilinmiyor',
      unit: p.service?.unit ?? 'adet',
      defaultPrice: p.service?.defaultPrice ?? 0,
      customPrice: p.price,
    }))

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      totalBalance,
      recordCount,
      activeServicesCount: serviceBreakdown.length,
      serviceBreakdown,
      monthlySummary,
      recentRecords,
      customPrices,
    })
  } catch (error) {
    console.error('Error fetching customer history:', error)
    return NextResponse.json(
      { error: 'Müşteri geçmişi yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}
