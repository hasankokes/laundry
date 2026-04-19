import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust for Sunday
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export async function GET() {
  try {
    const now = new Date()
    const today = formatDate(now)

    // 1. Weekly Comparison
    const thisMonday = getMonday(now)
    const lastMonday = new Date(thisMonday)
    lastMonday.setDate(lastMonday.getDate() - 7)
    const lastSunday = new Date(thisMonday)
    lastSunday.setDate(lastSunday.getDate() - 1)

    const [
      { data: thisWeekRecords, error: thisWeekError },
      { data: lastWeekRecords, error: lastWeekError },
    ] = await Promise.all([
      supabase
        .from('DailyRecord')
        .select('total')
        .gte('date', formatDate(thisMonday))
        .lte('date', today),
      supabase
        .from('DailyRecord')
        .select('total')
        .gte('date', formatDate(lastMonday))
        .lte('date', formatDate(lastSunday)),
    ])

    if (thisWeekError || lastWeekError) {
      console.error('Weekly comparison error:', thisWeekError || lastWeekError)
      return NextResponse.json(
        { error: 'Dashboard verileri yüklenemedi' },
        { status: 500 }
      )
    }

    const thisWeekRevenue = (thisWeekRecords ?? []).reduce((sum, r) => sum + r.total, 0)
    const lastWeekRevenue = (lastWeekRecords ?? []).reduce((sum, r) => sum + r.total, 0)
    const weeklyChange = lastWeekRevenue > 0
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
      : thisWeekRevenue > 0 ? 100 : 0

    // 2. Current Streak - consecutive days with records going backwards from yesterday
    let streak = 0
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() - 1) // start from yesterday
    // Fetch all records for the past year to check streak efficiently
    const oneYearAgo = new Date(now)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const { data: recentRecords, error: recentError } = await supabase
      .from('DailyRecord')
      .select('date')
      .gte('date', formatDate(oneYearAgo))
      .lte('date', today)

    if (recentError) {
      console.error('Streak query error:', recentError)
      return NextResponse.json(
        { error: 'Dashboard verileri yüklenemedi' },
        { status: 500 }
      )
    }

    const datesWithRecords = new Set((recentRecords ?? []).map(r => r.date))

    const streakStart = new Date(now)
    streakStart.setDate(streakStart.getDate() - 1)
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDate(streakStart)
      if (datesWithRecords.has(dateStr)) {
        streak++
        streakStart.setDate(streakStart.getDate() - 1)
      } else {
        break
      }
    }

    // 3. Best Day this month
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthStart = formatDate(new Date(currentYear, currentMonth, 1))
    const monthEnd = formatDate(new Date(currentYear, currentMonth + 1, 0))

    const { data: monthRecords, error: monthError } = await supabase
      .from('DailyRecord')
      .select('date, total')
      .gte('date', monthStart)
      .lte('date', monthEnd)

    if (monthError) {
      console.error('Month records error:', monthError)
      return NextResponse.json(
        { error: 'Dashboard verileri yüklenemedi' },
        { status: 500 }
      )
    }

    const dailyTotals: Record<string, number> = {}
    ;(monthRecords ?? []).forEach(r => {
      if (!dailyTotals[r.date]) dailyTotals[r.date] = 0
      dailyTotals[r.date] += r.total
    })

    let bestDay: { date: string; amount: number } | null = null
    Object.entries(dailyTotals).forEach(([date, amount]) => {
      if (!bestDay || amount > bestDay.amount) {
        bestDay = { date, amount }
      }
    })

    // 4. Monthly Target
    const totalMonthRevenue = (monthRecords ?? []).reduce((sum, r) => sum + r.total, 0)
    const daysWithMonthData = new Set((monthRecords ?? []).map(r => r.date)).size
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const monthlyTarget = daysWithMonthData > 0
      ? (totalMonthRevenue / daysWithMonthData) * daysInMonth
      : 0

    // 5. Revenue by Day of Week (all time)
    const { data: allRecords, error: allRecordsError } = await supabase
      .from('DailyRecord')
      .select('date, total')

    if (allRecordsError) {
      console.error('All records error:', allRecordsError)
      return NextResponse.json(
        { error: 'Dashboard verileri yüklenemedi' },
        { status: 500 }
      )
    }

    const dayOfWeekTotals: Record<number, { total: number; count: number }> = {
      1: { total: 0, count: 0 }, // Monday
      2: { total: 0, count: 0 },
      3: { total: 0, count: 0 },
      4: { total: 0, count: 0 },
      5: { total: 0, count: 0 },
      6: { total: 0, count: 0 },
      0: { total: 0, count: 0 }, // Sunday
    }

    // Track unique dates per day of week for proper averaging
    const dayOfWeekDates: Record<number, Set<string>> = {
      1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(),
      5: new Set(), 6: new Set(), 0: new Set(),
    }

    ;(allRecords ?? []).forEach(r => {
      const dayOfWeek = new Date(r.date + 'T00:00:00').getDay()
      dayOfWeekTotals[dayOfWeek].total += r.total
      dayOfWeekDates[dayOfWeek].add(r.date)
    })

    // Calculate average per day-of-week (total / number of unique dates)
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
    const revenueByDayOfWeek = [1, 2, 3, 4, 5, 6, 0].map(day => ({
      day: dayNames[day],
      average: dayOfWeekDates[day].size > 0
        ? dayOfWeekTotals[day].total / dayOfWeekDates[day].size
        : 0,
      total: dayOfWeekTotals[day].total,
      dayCount: dayOfWeekDates[day].size,
    }))

    // 6. Top Growth Customer
    const thisMonthStart = monthStart
    const thisMonthEnd = monthEnd

    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
    const prevMonthStart = formatDate(prevMonthDate)
    const prevMonthEnd = formatDate(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0))

    const [
      { data: thisMonthCustomerRecords, error: thisMonthError },
      { data: lastMonthCustomerRecords, error: lastMonthError2 },
    ] = await Promise.all([
      supabase
        .from('DailyRecord')
        .select('customerId, total, customer:Customer(name)')
        .gte('date', thisMonthStart)
        .lte('date', thisMonthEnd),
      supabase
        .from('DailyRecord')
        .select('customerId, total')
        .gte('date', prevMonthStart)
        .lte('date', prevMonthEnd),
    ])

    if (thisMonthError || lastMonthError2) {
      console.error('Top growth error:', thisMonthError || lastMonthError2)
      return NextResponse.json(
        { error: 'Dashboard verileri yüklenemedi' },
        { status: 500 }
      )
    }

    const thisMonthByCustomer: Record<string, { name: string; total: number }> = {}
    ;(thisMonthCustomerRecords ?? []).forEach(r => {
      if (!thisMonthByCustomer[r.customerId]) {
        thisMonthByCustomer[r.customerId] = { name: (r.customer as unknown as { name: string }).name, total: 0 }
      }
      thisMonthByCustomer[r.customerId].total += r.total
    })

    const lastMonthByCustomer: Record<string, number> = {}
    ;(lastMonthCustomerRecords ?? []).forEach(r => {
      if (!lastMonthByCustomer[r.customerId]) lastMonthByCustomer[r.customerId] = 0
      lastMonthByCustomer[r.customerId] += r.total
    })

    let topGrowthCustomer: {
      name: string
      thisMonth: number
      lastMonth: number
      change: number
    } | null = null

    Object.entries(thisMonthByCustomer).forEach(([customerId, data]) => {
      const lastMonthTotal = lastMonthByCustomer[customerId] ?? 0
      if (lastMonthTotal > 0) {
        const change = ((data.total - lastMonthTotal) / lastMonthTotal) * 100
        // Only consider customers with positive growth
        if (change > 0 && (!topGrowthCustomer || change > topGrowthCustomer.change)) {
          topGrowthCustomer = {
            name: data.name,
            thisMonth: data.total,
            lastMonth: lastMonthTotal,
            change,
          }
        }
      }
    })

    return NextResponse.json({
      weeklyComparison: {
        thisWeek: thisWeekRevenue,
        lastWeek: lastWeekRevenue,
        change: weeklyChange,
      },
      currentStreak: streak,
      bestDay: bestDay ?? { date: today, amount: 0 },
      monthlyTarget: {
        current: totalMonthRevenue,
        target: monthlyTarget,
        percentage: monthlyTarget > 0 ? (totalMonthRevenue / monthlyTarget) * 100 : 0,
      },
      revenueByDayOfWeek,
      topGrowthCustomer,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Dashboard verileri yüklenemedi' },
      { status: 500 }
    )
  }
}
