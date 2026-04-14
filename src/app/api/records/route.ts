import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/records - List records with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Prisma.DailyRecordWhereInput = {}

    if (customerId) {
      where.customerId = customerId
    }

    if (date) {
      where.date = date
    } else if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        (where.date as Prisma.StringFilter)['gte'] = startDate
      }
      if (endDate) {
        (where.date as Prisma.StringFilter)['lte'] = endDate
      }
    }

    const records = await db.dailyRecord.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, unit: true } },
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json(
      { error: 'Kayıtlar yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// POST /api/records - Create a new daily record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, serviceId, date, quantity, unitPrice, notes } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'Müşteri seçimi gereklidir' },
        { status: 400 }
      )
    }
    if (!serviceId) {
      return NextResponse.json(
        { error: 'Hizmet seçimi gereklidir' },
        { status: 400 }
      )
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Geçerli bir tarih giriniz (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const qty = typeof quantity === 'number' && quantity > 0 ? quantity : 1
    const price = typeof unitPrice === 'number' && unitPrice >= 0 ? unitPrice : 0
    const total = qty * price

    const record = await db.dailyRecord.create({
      data: {
        customerId,
        serviceId,
        date,
        quantity: qty,
        unitPrice: price,
        total,
        notes: notes?.trim() || null,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, unit: true } },
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json(
      { error: 'Kayıt oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
