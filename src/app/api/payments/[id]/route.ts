export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// PUT /api/payments/[id] - Update a payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, date, method, description } = body

    const { data: existing, error: existingError } = await supabase
      .from('Payment')
      .select('id')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Ödeme bulunamadı' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (date !== undefined) updateData.date = date
    if (method !== undefined) updateData.method = method
    if (description !== undefined) updateData.description = description?.trim() || null
    updateData.updatedAt = now()

    const { data: payment, error } = await supabase
      .from('Payment')
      .update(updateData)
      .eq('id', id)
      .select('*, customer:Customer(id, name, phone)')
      .single()

    if (error) {
      console.error('Error updating payment:', error)
      return NextResponse.json(
        { error: 'Ödeme güncellenirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Ödeme güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// DELETE /api/payments/[id] - Delete a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: existing, error: existingError } = await supabase
      .from('Payment')
      .select('id')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Ödeme bulunamadı' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('Payment')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting payment:', error)
      return NextResponse.json(
        { error: 'Ödeme silinirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Ödeme silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
