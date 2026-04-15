import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    // Delete in correct order to respect foreign key constraints
    const recordsResult = await db.dailyRecord.deleteMany()
    const pricesResult = await db.customerPrice.deleteMany()
    const customersResult = await db.customer.deleteMany()
    const servicesResult = await db.service.deleteMany()

    return NextResponse.json({
      message: 'Tüm veriler sıfırlandı',
      deleted: {
        records: recordsResult.count,
        prices: pricesResult.count,
        customers: customersResult.count,
        services: servicesResult.count,
      },
    })
  } catch (error) {
    console.error('Reset all data error:', error)
    return NextResponse.json(
      { error: 'Veriler sıfırlanırken hata oluştu' },
      { status: 500 }
    )
  }
}
