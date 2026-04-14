import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/services - List all services
export async function GET() {
  try {
    const services = await db.service.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { records: true, prices: true },
        },
      },
    })
    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Hizmetler yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, unit, defaultPrice } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Hizmet adı gereklidir' },
        { status: 400 }
      )
    }

    const service = await db.service.create({
      data: {
        name: name.trim(),
        unit: unit?.trim() || 'adet',
        defaultPrice: typeof defaultPrice === 'number' ? defaultPrice : 0,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Hizmet oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
