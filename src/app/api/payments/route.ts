import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/payments - List all payments with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Ödemeler yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, amount, date, method, description } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'Müşteri seçimi zorunludur' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Geçerli bir tutar giriniz' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Tarih zorunludur' },
        { status: 400 }
      )
    }

    // Verify customer exists
    const customer = await db.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    const payment = await db.payment.create({
      data: {
        customerId,
        amount: parseFloat(amount),
        date,
        method: method || 'nakit',
        description: description?.trim() || null,
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Ödeme oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
