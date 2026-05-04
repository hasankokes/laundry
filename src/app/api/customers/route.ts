import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// GET /api/customers - List all customers
export async function GET() {
  try {
    const { data: customers, error } = await supabase
      .from('Customer')
      .select('*')
      .order('isFavorite', { ascending: false })
      .order('displayOrder', { ascending: true })
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json(
        { error: 'Müşteriler yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    // Fetch ALL record counts per customer with pagination (Supabase default limit is 1000)
    const allRecordCounts: any[] = []
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await supabase
        .from('DailyRecord')
        .select('customerId')
        .range(page * 1000, (page + 1) * 1000 - 1)
      
      if (error) {
        console.error('Error fetching record counts:', error)
        return NextResponse.json({ error: 'Müşteriler yüklenirken hata oluştu' }, { status: 500 })
      }
      
      if (data) {
        allRecordCounts.push(...data)
        if (data.length < 1000) hasMore = false
        else page++
      } else {
        hasMore = false
      }
    }

    // Fetch ALL price counts per customer
    const allPriceCounts: any[] = []
    page = 0
    hasMore = true
    while (hasMore) {
      const { data, error } = await supabase
        .from('CustomerPrice')
        .select('customerId')
        .range(page * 1000, (page + 1) * 1000 - 1)
        
      if (error) {
        console.error('Error fetching price counts:', error)
        return NextResponse.json({ error: 'Müşteriler yüklenirken hata oluştu' }, { status: 500 })
      }
      
      if (data) {
        allPriceCounts.push(...data)
        if (data.length < 1000) hasMore = false
        else page++
      } else {
        hasMore = false
      }
    }

    // Build count maps
    const recordCountMap: Record<string, number> = {}
    for (const r of allRecordCounts) {
      recordCountMap[r.customerId] = (recordCountMap[r.customerId] || 0) + 1
    }

    const priceCountMap: Record<string, number> = {}
    for (const p of allPriceCounts) {
      priceCountMap[p.customerId] = (priceCountMap[p.customerId] || 0) + 1
    }

    // Merge counts into customer objects
    const result = (customers ?? []).map((customer: any) => ({
      ...customer,
      _count: {
        records: recordCountMap[customer.id] || 0,
        prices: priceCountMap[customer.id] || 0,
      },
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Müşteriler yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, address, taxNumber, notes, tag } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Müşteri adı gereklidir' },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()
    const { data: customer, error } = await supabase
      .from('Customer')
      .insert({
        id,
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        taxNumber: taxNumber?.trim() || null,
        notes: notes?.trim() || null,
        tag: tag?.trim() || null,
        createdAt: now(),
        updatedAt: now(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json(
        { error: 'Müşteri oluşturulurken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Müşteri oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

// PATCH /api/customers - Bulk reorder
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as { items: { id: string; displayOrder: number; isFavorite?: boolean }[] }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }

    for (const item of items) {
      const updateData: Record<string, unknown> = { displayOrder: item.displayOrder, updatedAt: now() }
      if (item.isFavorite !== undefined) updateData.isFavorite = item.isFavorite
      await supabase.from('Customer').update(updateData).eq('id', item.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering customers:', error)
    return NextResponse.json({ error: 'Sıralama güncellenirken hata oluştu' }, { status: 500 })
  }
}
