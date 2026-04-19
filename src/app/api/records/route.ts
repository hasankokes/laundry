import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// GET /api/records - List records with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('DailyRecord')
      .select('*, customer:Customer(id, name, phone), service:Service(id, name, unit)')

    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    if (date) {
      query = query.eq('date', date)
    } else if (startDate || endDate) {
      if (startDate) query = query.gte('date', startDate)
      if (endDate) query = query.lte('date', endDate)
    }

    query = query.order('date', { ascending: false }).order('createdAt', { ascending: false })

    const { data: records, error } = await query

    if (error) {
      console.error('Error fetching records:', error)
      return NextResponse.json(
        { error: 'Kayıtlar yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

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

    const { data: record, error } = await supabase
      .from('DailyRecord')
      .insert({
        id: crypto.randomUUID(),
        customerId,
        serviceId,
        date,
        quantity: qty,
        unitPrice: price,
        total,
        notes: notes?.trim() || null,
        createdAt: now(),
        updatedAt: now(),
      })
      .select('*, customer:Customer(id, name, phone), service:Service(id, name, unit)')
      .single()

    if (error) {
      console.error('Error creating record:', error)
      return NextResponse.json(
        { error: 'Kayıt oluşturulurken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json(
      { error: 'Kayıt oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
