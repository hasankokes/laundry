import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [customers, services, customerPrices, dailyRecords] = await Promise.all([
      db.customer.findMany({ orderBy: { createdAt: 'asc' } }),
      db.service.findMany({ orderBy: { createdAt: 'asc' } }),
      db.customerPrice.findMany({ orderBy: { createdAt: 'asc' } }),
      db.dailyRecord.findMany({ orderBy: { date: 'desc' } }),
    ])

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        app: 'Camasirhane Yonetim Sistemi',
      },
      customers,
      services,
      customerPrices,
      dailyRecords,
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Veri dışa aktarılırken hata oluştu' },
      { status: 500 }
    )
  }
}
