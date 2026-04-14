import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/services/[id] - Get a single service
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const service = await db.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: { records: true, prices: true },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { error: 'Hizmet yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// PUT /api/services/[id] - Update a service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, unit, defaultPrice } = body

    const existing = await db.service.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404 }
      )
    }

    const service = await db.service.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        unit: unit !== undefined ? unit?.trim() || 'adet' : undefined,
        defaultPrice: defaultPrice !== undefined ? defaultPrice : undefined,
      },
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Hizmet güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.service.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404 }
      )
    }

    await db.service.delete({ where: { id } })

    return NextResponse.json({ message: 'Hizmet silindi' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Hizmet silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
