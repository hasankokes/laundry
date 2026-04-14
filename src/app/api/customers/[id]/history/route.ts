import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        prices: {
          include: { service: true },
          orderBy: { service: { name: 'asc' } },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Build date filter for records
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = startDate
    if (endDate) dateFilter.lte = endDate

    const whereClause: any = { customerId: id }
    if (startDate || endDate) {
      whereClause.date = dateFilter
    }

    // Get all records for this customer
    const records = await db.dailyRecord.findMany({
      where: whereClause,
      include: { service: true },
      orderBy: { date: 'desc' },
    })

    // Calculate totals
    const totalBalance = records.reduce((sum, r) => sum + r.total, 0)
    const recordCount = records.length

    // Service breakdown
    const serviceMap: Record<string, {
      serviceId: string
      serviceName: string
      unit: string
      totalQuantity: number
      totalRevenue: number
    }> = {}

    records.forEach(r => {
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

    records.forEach(r => {
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
    const recentRecords = records.slice(0, 20).map(r => ({
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
    const customPrices = customer.prices.map(p => ({
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
