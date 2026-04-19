import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// GET /api/services/[id] - Get a single service
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: service, error } = await supabase
      .from('Service')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Hizmet bulunamadı' },
          { status: 404 }
        )
      }
      console.error('Error fetching service:', error)
      return NextResponse.json(
        { error: 'Hizmet yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    // Fetch counts
    const [recordsResult, pricesResult] = await Promise.all([
      supabase.from('DailyRecord').select('id', { count: 'exact', head: true }).eq('serviceId', id),
      supabase.from('CustomerPrice').select('id', { count: 'exact', head: true }).eq('serviceId', id),
    ])

    const serviceWithCount = {
      ...service,
      _count: {
        records: recordsResult.count ?? 0,
        prices: pricesResult.count ?? 0,
      },
    }

    return NextResponse.json(serviceWithCount)
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
    const { name, unit, defaultPrice, isFavorite, displayOrder } = body

    const { data: existing, error: existingError } = await supabase
      .from('Service')
      .select('*')
      .eq('id', id)
      .single()

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Hizmet bulunamadı' },
          { status: 404 }
        )
      }
      console.error('Error fetching service:', existingError)
      return NextResponse.json(
        { error: 'Hizmet güncellenirken hata oluştu' },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (unit !== undefined) updateData.unit = unit?.trim() || 'adet'
    if (defaultPrice !== undefined) updateData.defaultPrice = defaultPrice
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder
    updateData.updatedAt = now()

    const { data: service, error } = await supabase
      .from('Service')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      return NextResponse.json(
        { error: 'Hizmet güncellenirken hata oluştu' },
        { status: 500 }
      )
    }

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

    const { data: existing, error: existingError } = await supabase
      .from('Service')
      .select('*')
      .eq('id', id)
      .single()

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Hizmet bulunamadı' },
          { status: 404 }
        )
      }
      console.error('Error fetching service:', existingError)
      return NextResponse.json(
        { error: 'Hizmet silinirken hata oluştu' },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('Service')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting service:', error)
      return NextResponse.json(
        { error: 'Hizmet silinirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Hizmet silindi' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Hizmet silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
