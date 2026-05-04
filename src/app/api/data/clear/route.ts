export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const { count, error } = await supabase
      .from('DailyRecord')
      .delete({ count: 'exact' })
      .neq('id', '')

    if (error) {
      console.error('Clear records error:', error)
      return NextResponse.json(
        { error: 'Kayıtlar silinirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tüm kayıtlar silindi',
      deletedCount: count ?? 0,
    })
  } catch (error) {
    console.error('Clear records error:', error)
    return NextResponse.json(
      { error: 'Kayıtlar silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
