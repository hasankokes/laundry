import { supabase, now } from '@/lib/supabase'
import { NextResponse } from 'next/server'

interface ImportData {
  metadata?: {
    exportDate?: string
    version?: string
    app?: string
  }
  customers?: {
    id: string
    name: string
    phone?: string | null
    address?: string | null
    notes?: string | null
    createdAt?: string
    updatedAt?: string
  }[]
  services?: {
    id: string
    name: string
    unit?: string
    defaultPrice?: number
    createdAt?: string
    updatedAt?: string
  }[]
  customerPrices?: {
    id: string
    customerId: string
    serviceId: string
    price: number
    createdAt?: string
    updatedAt?: string
  }[]
  dailyRecords?: {
    id: string
    customerId: string
    serviceId: string
    date: string
    quantity?: number
    unitPrice: number
    total: number
    notes?: string | null
    createdAt?: string
    updatedAt?: string
  }[]
}

export async function POST(request: Request) {
  try {
    const body: ImportData = await request.json()

    if (!body.customers && !body.services && !body.customerPrices && !body.dailyRecords) {
      return NextResponse.json(
        { error: 'Geçerli veri bulunamadı' },
        { status: 400 }
      )
    }

    const result = {
      customers: 0,
      services: 0,
      customerPrices: 0,
      dailyRecords: 0,
    }

    // Import customers
    if (body.customers && Array.isArray(body.customers)) {
      const validCustomers = body.customers
        .filter(c => c.id && c.name)
        .map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone ?? null,
          address: c.address ?? null,
          notes: c.notes ?? null,
          createdAt: c.createdAt ?? now(),
          updatedAt: c.updatedAt ?? now(),
        }))

      if (validCustomers.length > 0) {
        const { error } = await supabase
          .from('Customer')
          .upsert(validCustomers, { onConflict: 'id' })

        if (!error) {
          result.customers = validCustomers.length
        } else {
          console.error('Import customers error:', error)
        }
      }
    }

    // Import services
    if (body.services && Array.isArray(body.services)) {
      const validServices = body.services
        .filter(s => s.id && s.name)
        .map(s => ({
          id: s.id,
          name: s.name,
          unit: s.unit ?? 'adet',
          defaultPrice: s.defaultPrice ?? 0,
          createdAt: s.createdAt ?? now(),
          updatedAt: s.updatedAt ?? now(),
        }))

      if (validServices.length > 0) {
        const { error } = await supabase
          .from('Service')
          .upsert(validServices, { onConflict: 'id' })

        if (!error) {
          result.services = validServices.length
        } else {
          console.error('Import services error:', error)
        }
      }
    }

    // Import customer prices
    if (body.customerPrices && Array.isArray(body.customerPrices)) {
      const validPrices = body.customerPrices
        .filter(p => p.id && p.customerId && p.serviceId)
        .map(p => ({
          id: p.id,
          customerId: p.customerId,
          serviceId: p.serviceId,
          price: p.price,
          createdAt: p.createdAt ?? now(),
          updatedAt: p.updatedAt ?? now(),
        }))

      if (validPrices.length > 0) {
        const { error } = await supabase
          .from('CustomerPrice')
          .upsert(validPrices, { onConflict: 'id' })

        if (!error) {
          result.customerPrices = validPrices.length
        } else {
          console.error('Import customer prices error:', error)
        }
      }
    }

    // Import daily records
    if (body.dailyRecords && Array.isArray(body.dailyRecords)) {
      const validRecords = body.dailyRecords
        .filter(r => r.id && r.customerId && r.serviceId && r.date)
        .map(r => ({
          id: r.id,
          customerId: r.customerId,
          serviceId: r.serviceId,
          date: r.date,
          quantity: r.quantity ?? 1,
          unitPrice: r.unitPrice,
          total: r.total,
          notes: r.notes ?? null,
          createdAt: r.createdAt ?? now(),
          updatedAt: r.updatedAt ?? now(),
        }))

      if (validRecords.length > 0) {
        const { error } = await supabase
          .from('DailyRecord')
          .upsert(validRecords, { onConflict: 'id' })

        if (!error) {
          result.dailyRecords = validRecords.length
        } else {
          console.error('Import daily records error:', error)
        }
      }
    }

    return NextResponse.json({
      message: 'Veriler başarıyla içe aktarıldı',
      imported: result,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Veri içe aktarılırken hata oluştu' },
      { status: 500 }
    )
  }
}
