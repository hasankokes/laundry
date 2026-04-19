import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// GET /api/payments - List all payments with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('Payment')
      .select('*, customer:Customer(id, name, phone)')
      .order('date', { ascending: false })

    if (customerId) query = query.eq('customerId', customerId)
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data: payments, error } = await query

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Ödemeler yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

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
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id, name, phone')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    const { data: payment, error } = await supabase
      .from('Payment')
      .insert({
        id: crypto.randomUUID(),
        customerId,
        amount: parseFloat(amount),
        date,
        method: method || 'nakit',
        description: description?.trim() || null,
        createdAt: now(),
        updatedAt: now(),
      })
      .select('*, customer:Customer(id, name, phone)')
      .single()

    if (error) {
      console.error('Error creating payment:', error)
      return NextResponse.json(
        { error: 'Ödeme oluşturulurken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Ödeme oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
