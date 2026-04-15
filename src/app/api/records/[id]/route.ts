import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/records/[id] - Update a daily record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customerId, serviceId, date, quantity, unitPrice, notes } = body

    const existing = await db.dailyRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Kayıt bulunamadı' },
        { status: 404 }
      )
    }

    const qty = quantity !== undefined ? (typeof quantity === 'number' && quantity > 0 ? quantity : 1) : existing.quantity
    const price = unitPrice !== undefined ? (typeof unitPrice === 'number' && unitPrice >= 0 ? unitPrice : 0) : existing.unitPrice
    const total = qty * price

    const record = await db.dailyRecord.update({
      where: { id },
      data: {
        customerId: customerId || undefined,
        serviceId: serviceId || undefined,
        date: date || undefined,
        quantity: qty,
        unitPrice: price,
        total,
        notes: notes !== undefined ? notes?.trim() || null : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, unit: true } },
      },
    })

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

    const existing = await db.dailyRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Kayıt bulunamadı' },
        { status: 404 }
      )
    }

    await db.dailyRecord.delete({ where: { id } })

    return NextResponse.json({ message: 'Kayıt silindi' })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json(
      { error: 'Kayıt silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
