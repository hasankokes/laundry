export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// GET /api/services - List all services
export async function GET() {
  try {
    const { data: services, error } = await supabase
      .from('Service')
      .select('*')
      .order('isFavorite', { ascending: false })
      .order('displayOrder', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json(
        { error: 'Hizmetler yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    // Fetch record counts for each service
    const servicesWithCounts = await Promise.all(
      (services ?? []).map(async (service: Record<string, unknown>) => {
        const [recordsResult, pricesResult] = await Promise.all([
          supabase.from('DailyRecord').select('id', { count: 'exact', head: true }).eq('serviceId', service.id),
          supabase.from('CustomerPrice').select('id', { count: 'exact', head: true }).eq('serviceId', service.id),
        ])
        return {
          ...service,
          _count: {
            records: recordsResult.count ?? 0,
            prices: pricesResult.count ?? 0,
          },
        }
      })
    )

    return NextResponse.json(servicesWithCounts)
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

    const { data: service, error } = await supabase
      .from('Service')
      .insert({
        id: crypto.randomUUID(),
        name: name.trim(),
        unit: unit?.trim() || 'adet',
        defaultPrice: typeof defaultPrice === 'number' ? defaultPrice : 0,
        createdAt: now(),
        updatedAt: now(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return NextResponse.json(
        { error: 'Hizmet oluşturulurken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Hizmet oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

// PATCH /api/services - Bulk reorder
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as { items: { id: string; displayOrder: number; isFavorite?: boolean }[] }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }

    for (const item of items) {
      const updateData: Record<string, unknown> = { displayOrder: item.displayOrder, updatedAt: now() }
      if (item.isFavorite !== undefined) updateData.isFavorite = item.isFavorite
      await supabase.from('Service').update(updateData).eq('id', item.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering services:', error)
    return NextResponse.json({ error: 'Sıralama güncellenirken hata oluştu' }, { status: 500 })
  }
}
