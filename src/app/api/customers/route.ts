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

    // Fetch record counts per customer
    const { data: recordCounts, error: recordCountsError } = await supabase
      .from('DailyRecord')
      .select('customerId')
    if (recordCountsError) {
      console.error('Error fetching record counts:', recordCountsError)
      return NextResponse.json(
        { error: 'Müşteriler yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    // Fetch price counts per customer
    const { data: priceCounts, error: priceCountsError } = await supabase
      .from('CustomerPrice')
      .select('customerId')
    if (priceCountsError) {
      console.error('Error fetching price counts:', priceCountsError)
      return NextResponse.json(
        { error: 'Müşteriler yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    // Build count maps
    const recordCountMap: Record<string, number> = {}
    for (const r of recordCounts ?? []) {
      recordCountMap[r.customerId] = (recordCountMap[r.customerId] || 0) + 1
    }

    const priceCountMap: Record<string, number> = {}
    for (const p of priceCounts ?? []) {
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
