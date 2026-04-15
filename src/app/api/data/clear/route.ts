import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const result = await db.dailyRecord.deleteMany()

    return NextResponse.json({
      message: 'Tüm kayıtlar silindi',
      deletedCount: result.count,
    })
  } catch (error) {
    console.error('Clear records error:', error)
    return NextResponse.json(
      { error: 'Kayıtlar silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
