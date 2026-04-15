import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/prices - List prices with optional filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const where: Prisma.CustomerPriceWhereInput = {}

    if (customerId) {
      where.customerId = customerId
    }

    const prices = await db.customerPrice.findMany({
      where,
      orderBy: [{ customer: { name: 'asc' } }, { service: { name: 'asc' } }],
      include: {
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, unit: true, defaultPrice: true } },
      },
    })

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Fiyatlar yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// POST /api/prices - Create or update a customer-specific price
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, serviceId, price } = body

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
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Geçerli bir fiyat giriniz' },
        { status: 400 }
      )
    }

    // Upsert: create or update the customer-specific price
    const customerPrice = await db.customerPrice.upsert({
      where: {
        customerId_serviceId: { customerId, serviceId },
      },
      update: { price },
      create: { customerId, serviceId, price },
      include: {
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, unit: true, defaultPrice: true } },
      },
    })

    return NextResponse.json(customerPrice, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating price:', error)
    return NextResponse.json(
      { error: 'Fiyat kaydedilirken hata oluştu' },
      { status: 500 }
    )
  }
}
