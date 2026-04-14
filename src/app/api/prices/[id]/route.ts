import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/prices/[id] - Update a customer price
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { price } = body

    const existing = await db.customerPrice.findUnique({ where: { id } })
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

    const customerPrice = await db.customerPrice.update({
      where: { id },
      data: { price },
      include: {
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, unit: true, defaultPrice: true } },
      },
    })

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

    const existing = await db.customerPrice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Fiyat kaydı bulunamadı' },
        { status: 404 }
      )
    }

    await db.customerPrice.delete({ where: { id } })

    return NextResponse.json({ message: 'Fiyat kaydı silindi' })
  } catch (error) {
    console.error('Error deleting price:', error)
    return NextResponse.json(
      { error: 'Fiyat kaydı silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
