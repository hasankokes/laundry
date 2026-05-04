export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      { data: customers, error: customersError },
      { data: services, error: servicesError },
      { data: customerPrices, error: customerPricesError },
      { data: dailyRecords, error: dailyRecordsError },
    ] = await Promise.all([
      supabase.from('Customer').select('*').order('createdAt', { ascending: true }),
      supabase.from('Service').select('*').order('createdAt', { ascending: true }),
      supabase.from('CustomerPrice').select('*').order('createdAt', { ascending: true }),
      supabase.from('DailyRecord').select('*').order('date', { ascending: false }),
    ])

    if (customersError || servicesError || customerPricesError || dailyRecordsError) {
      console.error('Export error:', customersError || servicesError || customerPricesError || dailyRecordsError)
      return NextResponse.json(
        { error: 'Veri dışa aktarılırken hata oluştu' },
        { status: 500 }
      )
    }

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
