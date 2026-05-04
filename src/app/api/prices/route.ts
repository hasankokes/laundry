export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// GET /api/prices - List prices with optional filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    let query = supabase
      .from('CustomerPrice')
      .select('*, customer:Customer(id, name), service:Service(id, name, unit, defaultPrice)')

    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    const { data: prices, error } = await query

    if (error) {
      console.error('Error fetching prices:', error)
      return NextResponse.json(
        { error: 'Fiyatlar yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    // Sort by customer name, then service name (replacing Prisma orderBy with relations)
    const sorted = (prices ?? []).sort((a: Record<string, any>, b: Record<string, any>) => {
      const customerCompare = (a.customer?.name ?? '').localeCompare(b.customer?.name ?? '')
      if (customerCompare !== 0) return customerCompare
      return (a.service?.name ?? '').localeCompare(b.service?.name ?? '')
    })

    return NextResponse.json(sorted)
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
    const { data: customerPrice, error } = await supabase
      .from('CustomerPrice')
      .upsert(
        { id: crypto.randomUUID(), customerId, serviceId, price, createdAt: now(), updatedAt: now() },
        { onConflict: 'customerId,serviceId' }
      )
      .select('*, customer:Customer(id, name), service:Service(id, name, unit, defaultPrice)')
      .single()

    if (error) {
      console.error('Error creating/updating price:', error)
      return NextResponse.json(
        { error: 'Fiyat kaydedilirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(customerPrice, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating price:', error)
    return NextResponse.json(
      { error: 'Fiyat kaydedilirken hata oluştu' },
      { status: 500 }
    )
  }
}
