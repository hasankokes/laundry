export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// GET /api/customers/[id] - Get a single customer with relations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: customer, error } = await supabase
      .from('Customer')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Fetch prices with service, ordered by service name
    const { data: prices, error: pricesError } = await supabase
      .from('CustomerPrice')
      .select('*, service:Service(*)')
      .eq('customerId', id)
    if (pricesError) {
      console.error('Error fetching prices:', pricesError)
      return NextResponse.json(
        { error: 'Müşteri yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    // Sort prices by service name
    const sortedPrices = (prices ?? []).sort((a: any, b: any) => {
      const nameA = a.service?.name ?? ''
      const nameB = b.service?.name ?? ''
      return nameA.localeCompare(nameB)
    })

    // Fetch records with service, ordered by createdAt desc, limited to 50
    const { data: records, error: recordsError } = await supabase
      .from('DailyRecord')
      .select('*, service:Service(*)')
      .eq('customerId', id)
      .order('createdAt', { ascending: false })
      .limit(50)
    if (recordsError) {
      console.error('Error fetching records:', recordsError)
      return NextResponse.json(
        { error: 'Müşteri yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...customer,
      prices: sortedPrices,
      records: records ?? [],
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Müşteri yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, address, taxNumber, notes, tag, isFavorite, displayOrder } = body

    const { data: existing, error: existingError } = await supabase
      .from('Customer')
      .select('id')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    const data: Record<string, any> = {}
    if (name !== undefined) data.name = name.trim()
    if (phone !== undefined) data.phone = phone?.trim() || null
    if (address !== undefined) data.address = address?.trim() || null
    if (taxNumber !== undefined) data.taxNumber = taxNumber?.trim() || null
    if (notes !== undefined) data.notes = notes?.trim() || null
    if (tag !== undefined) data.tag = tag?.trim() || null
    if (isFavorite !== undefined) data.isFavorite = isFavorite
    if (displayOrder !== undefined) data.displayOrder = displayOrder
    data.updatedAt = now()

    const { data: customer, error } = await supabase
      .from('Customer')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json(
        { error: 'Müşteri güncellenirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Müşteri güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: existing, error: existingError } = await supabase
      .from('Customer')
      .select('id')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('Customer')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting customer:', error)
      return NextResponse.json(
        { error: 'Müşteri silinirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Müşteri silindi' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Müşteri silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
