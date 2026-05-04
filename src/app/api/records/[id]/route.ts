export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// PUT /api/records/[id] - Update a daily record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customerId, serviceId, date, quantity, unitPrice, notes } = body

    const { data: existing, error: existingError } = await supabase
      .from('DailyRecord')
      .select('*')
      .eq('id', id)
      .single()

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Kayıt bulunamadı' },
          { status: 404 }
        )
      }
      console.error('Error fetching record:', existingError)
      return NextResponse.json(
        { error: 'Kayıt güncellenirken hata oluştu' },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Kayıt bulunamadı' },
        { status: 404 }
      )
    }

    const qty = quantity !== undefined ? (typeof quantity === 'number' && quantity > 0 ? quantity : 1) : existing.quantity
    const price = unitPrice !== undefined ? (typeof unitPrice === 'number' && unitPrice >= 0 ? unitPrice : 0) : existing.unitPrice
    const total = qty * price

    const updateData: Record<string, unknown> = {
      quantity: qty,
      unitPrice: price,
      total,
    }
    if (customerId) updateData.customerId = customerId
    if (serviceId) updateData.serviceId = serviceId
    if (date) updateData.date = date
    if (notes !== undefined) updateData.notes = notes?.trim() || null
    updateData.updatedAt = now()

    const { data: record, error } = await supabase
      .from('DailyRecord')
      .update(updateData)
      .eq('id', id)
      .select('*, customer:Customer(id, name, phone), service:Service(id, name, unit)')
      .single()

    if (error) {
      console.error('Error updating record:', error)
      return NextResponse.json(
        { error: 'Kayıt güncellenirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json(
      { error: 'Kayıt güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// DELETE /api/records/[id] - Delete a daily record
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: existing, error: existingError } = await supabase
      .from('DailyRecord')
      .select('*')
      .eq('id', id)
      .single()

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Kayıt bulunamadı' },
          { status: 404 }
        )
      }
      console.error('Error fetching record:', existingError)
      return NextResponse.json(
        { error: 'Kayıt silinirken hata oluştu' },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Kayıt bulunamadı' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('DailyRecord')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting record:', error)
      return NextResponse.json(
        { error: 'Kayıt silinirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Kayıt silindi' })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json(
      { error: 'Kayıt silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
