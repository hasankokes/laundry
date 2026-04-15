import { db } from '@/lib/db'
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
      for (const customer of body.customers) {
        if (!customer.id || !customer.name) continue
        try {
          await db.customer.upsert({
            where: { id: customer.id },
            update: {
              name: customer.name,
              phone: customer.phone ?? null,
              address: customer.address ?? null,
              notes: customer.notes ?? null,
            },
            create: {
              id: customer.id,
              name: customer.name,
              phone: customer.phone ?? null,
              address: customer.address ?? null,
              notes: customer.notes ?? null,
            },
          })
          result.customers++
        } catch {
          // Skip duplicates or invalid records
        }
      }
    }

    // Import services
    if (body.services && Array.isArray(body.services)) {
      for (const service of body.services) {
        if (!service.id || !service.name) continue
        try {
          await db.service.upsert({
            where: { id: service.id },
            update: {
              name: service.name,
              unit: service.unit ?? 'adet',
              defaultPrice: service.defaultPrice ?? 0,
            },
            create: {
              id: service.id,
              name: service.name,
              unit: service.unit ?? 'adet',
              defaultPrice: service.defaultPrice ?? 0,
            },
          })
          result.services++
        } catch {
          // Skip duplicates or invalid records
        }
      }
    }

    // Import customer prices
    if (body.customerPrices && Array.isArray(body.customerPrices)) {
      for (const price of body.customerPrices) {
        if (!price.id || !price.customerId || !price.serviceId) continue
        try {
          await db.customerPrice.upsert({
            where: { id: price.id },
            update: {
              price: price.price,
            },
            create: {
              id: price.id,
              customerId: price.customerId,
              serviceId: price.serviceId,
              price: price.price,
            },
          })
          result.customerPrices++
        } catch {
          // Skip duplicates or invalid records
        }
      }
    }

    // Import daily records
    if (body.dailyRecords && Array.isArray(body.dailyRecords)) {
      for (const record of body.dailyRecords) {
        if (!record.id || !record.customerId || !record.serviceId || !record.date) continue
        try {
          await db.dailyRecord.upsert({
            where: { id: record.id },
            update: {
              quantity: record.quantity ?? 1,
              unitPrice: record.unitPrice,
              total: record.total,
              notes: record.notes ?? null,
            },
            create: {
              id: record.id,
              customerId: record.customerId,
              serviceId: record.serviceId,
              date: record.date,
              quantity: record.quantity ?? 1,
              unitPrice: record.unitPrice,
              total: record.total,
              notes: record.notes ?? null,
            },
          })
          result.dailyRecords++
        } catch {
          // Skip duplicates or invalid records
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
