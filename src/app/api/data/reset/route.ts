import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    // Delete in correct order to respect foreign key constraints
    const { count: recordsCount, error: recordsError } = await supabase
      .from('DailyRecord')
      .delete({ count: 'exact' })
      .neq('id', '')

    if (recordsError) {
      console.error('Reset records error:', recordsError)
      return NextResponse.json(
        { error: 'Veriler sıfırlanırken hata oluştu' },
        { status: 500 }
      )
    }

    const { count: pricesCount, error: pricesError } = await supabase
      .from('CustomerPrice')
      .delete({ count: 'exact' })
      .neq('id', '')

    if (pricesError) {
      console.error('Reset prices error:', pricesError)
      return NextResponse.json(
        { error: 'Veriler sıfırlanırken hata oluştu' },
        { status: 500 }
      )
    }

    const { count: customersCount, error: customersError } = await supabase
      .from('Customer')
      .delete({ count: 'exact' })
      .neq('id', '')

    if (customersError) {
      console.error('Reset customers error:', customersError)
      return NextResponse.json(
        { error: 'Veriler sıfırlanırken hata oluştu' },
        { status: 500 }
      )
    }

    const { count: servicesCount, error: servicesError } = await supabase
      .from('Service')
      .delete({ count: 'exact' })
      .neq('id', '')

    if (servicesError) {
      console.error('Reset services error:', servicesError)
      return NextResponse.json(
        { error: 'Veriler sıfırlanırken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tüm veriler sıfırlandı',
      deleted: {
        records: recordsCount ?? 0,
        prices: pricesCount ?? 0,
        customers: customersCount ?? 0,
        services: servicesCount ?? 0,
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
