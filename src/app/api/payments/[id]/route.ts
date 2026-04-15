import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/payments/[id] - Update a payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, date, method, description } = body

    const existing = await db.payment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Ödeme bulunamadı' },
        { status: 404 }
      )
    }

    const payment = await db.payment.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date !== undefined && { date }),
        ...(method !== undefined && { method }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

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

    const existing = await db.payment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Ödeme bulunamadı' },
        { status: 404 }
      )
    }

    await db.payment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Ödeme silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
