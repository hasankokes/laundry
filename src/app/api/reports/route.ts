export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/reports - Date range summary report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Başlangıç ve bitiş tarihi gereklidir' },
        { status: 400 }
      )
    }

    // Build query with filters
    let query = supabase
      .from('DailyRecord')
      .select('*, customer:Customer(id, name), service:Service(id, name, unit)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (customerId) query = query.eq('customerId', customerId)

    const { data: records, error } = await query

    if (error) {
      console.error('Error generating report:', error)
      return NextResponse.json(
        { error: 'Rapor oluşturulurken hata oluştu' },
        { status: 500 }
      )
    }

    // Aggregate by service
    const byService: Record<string, {
      serviceId: string
      serviceName: string
      unit: string
      totalQuantity: number
      totalRevenue: number
      recordCount: number
    }> = {}

    // Aggregate by customer
    const byCustomer: Record<string, {
      customerId: string
      customerName: string
      totalRevenue: number
      recordCount: number
      services: Record<string, {
        serviceId: string
        serviceName: string
        quantity: number
        revenue: number
      }>
    }> = {}

    // Aggregate by date
    const byDate: Record<string, {
      date: string
      totalRevenue: number
      recordCount: number
    }> = {}

    let totalRevenue = 0
    let totalQuantity = 0
    let totalRecordCount = records ? records.length : 0

    for (const record of records ?? []) {
      totalRevenue += record.total
      totalQuantity += record.quantity

      // By service
      if (!byService[record.serviceId]) {
        byService[record.serviceId] = {
          serviceId: record.serviceId,
          serviceName: record.service.name,
          unit: record.service.unit,
          totalQuantity: 0,
          totalRevenue: 0,
          recordCount: 0,
        }
      }
      byService[record.serviceId].totalQuantity += record.quantity
      byService[record.serviceId].totalRevenue += record.total
      byService[record.serviceId].recordCount += 1

      // By customer
      if (!byCustomer[record.customerId]) {
        byCustomer[record.customerId] = {
          customerId: record.customerId,
          customerName: record.customer.name,
          totalRevenue: 0,
          recordCount: 0,
          services: {},
        }
      }
      byCustomer[record.customerId].totalRevenue += record.total
      byCustomer[record.customerId].recordCount += 1

      // Customer -> service breakdown
      if (!byCustomer[record.customerId].services[record.serviceId]) {
        byCustomer[record.customerId].services[record.serviceId] = {
          serviceId: record.serviceId,
          serviceName: record.service.name,
          quantity: 0,
          revenue: 0,
        }
      }
      byCustomer[record.customerId].services[record.serviceId].quantity += record.quantity
      byCustomer[record.customerId].services[record.serviceId].revenue += record.total

      // By date
      if (!byDate[record.date]) {
        byDate[record.date] = {
          date: record.date,
          totalRevenue: 0,
          recordCount: 0,
        }
      }
      byDate[record.date].totalRevenue += record.total
      byDate[record.date].recordCount += 1
    }

    // Convert aggregated maps to sorted arrays
    const servicesSummary = Object.values(byService).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    )

    const customersSummary = Object.values(byCustomer)
      .map((c) => ({
        ...c,
        services: Object.values(c.services).sort(
          (a, b) => b.revenue - a.revenue
        ),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    const datesSummary = Object.values(byDate).sort(
      (a, b) => a.date.localeCompare(b.date)
    )

    return NextResponse.json({
      startDate,
      endDate,
      customerId,
      summary: {
        totalRevenue,
        totalQuantity,
        totalRecordCount,
        uniqueCustomers: Object.keys(byCustomer).length,
        uniqueServices: Object.keys(byService).length,
      },
      byService: servicesSummary,
      byCustomer: customersSummary,
      byDate: datesSummary,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Rapor oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
