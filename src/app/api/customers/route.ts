export const dynamic = 'force-dynamic';
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

    // Fetch record counts using Supabase's built-in count — no row limit issues
    // We use .select('customerId', { count: 'exact' }) grouped by customerId
    // Since Supabase JS doesn't support GROUP BY natively, we fetch all customerIds
    // with range pagination to avoid the 1000-row default limit
    const countMap: Record<string, number> = {}
    let from = 0
    const pageSize = 1000
    while (true) {
      const { data: batch, error: batchError } = await supabase
        .from('DailyRecord')
        .select('customerId')
        .range(from, from + pageSize - 1)
      
      if (batchError || !batch || batch.length === 0) break
      
      for (const r of batch) {
        countMap[r.customerId] = (countMap[r.customerId] ?? 0) + 1
      }
      
      if (batch.length < pageSize) break // last page
      from += pageSize
    }

    const result = (customers ?? []).map((customer: any) => ({
      ...customer,
      _count: {
        records: countMap[customer.id] ?? 0,
        prices: 0,
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
