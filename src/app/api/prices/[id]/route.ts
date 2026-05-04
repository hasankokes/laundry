export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// PUT /api/prices/[id] - Update a customer price
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { price } = body

    const { data: existing, error: existingError } = await supabase
      .from('CustomerPrice')
      .select('*')
      .eq('id', id)
      .single()

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Fiyat kaydı bulunamadı' },
          { status: 404 }
        )
      }
      console.error('Error fetching price:', existingError)
      return NextResponse.json(
        { error: 'Fiyat güncellenirken hata oluştu' },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Fiyat kaydı bulunamadı' },
        { status: 404 }
      )
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Geçerli bir fiyat giriniz' },
        { status: 400 }
      )
    }

    const { data: customerPrice, error } = await supabase
      .from('CustomerPrice')
      .update({ price, updatedAt: now() })
      .eq('id', id)
      .select('*, customer:Customer(id, name), service:Service(id, name, unit, defaultPrice)')
      .single()

    if (error) {
      console.error('Error updating price:', error)
      return NextResponse.json(
        { error: 'Fiyat güncellenirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(customerPrice)
  } catch (error) {
    console.error('Error updating price:', error)
    return NextResponse.json(
      { error: 'Fiyat güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// DELETE /api/prices/[id] - Delete a customer price
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: existing, error: existingError } = await supabase
      .from('CustomerPrice')
      .select('*')
      .eq('id', id)
      .single()

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Fiyat kaydı bulunamadı' },
          { status: 404 }
        )
      }
      console.error('Error fetching price:', existingError)
      return NextResponse.json(
        { error: 'Fiyat kaydı silinirken hata oluştu' },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Fiyat kaydı bulunamadı' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('CustomerPrice')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting price:', error)
      return NextResponse.json(
        { error: 'Fiyat kaydı silinirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Fiyat kaydı silindi' })
  } catch (error) {
    console.error('Error deleting price:', error)
    return NextResponse.json(
      { error: 'Fiyat kaydı silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
