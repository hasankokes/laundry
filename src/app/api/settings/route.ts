export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'

// GET /api/settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Settings')
      .select('*')
      .eq('id', 'default')
      .single()

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Ayarlar yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Ayarlar yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// PATCH /api/settings - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    const updateData: Record<string, unknown> = { updatedAt: now() }
    if (body.companyName !== undefined) updateData.companyName = body.companyName
    if (body.companyAddress !== undefined) updateData.companyAddress = body.companyAddress
    if (body.companyPhone !== undefined) updateData.companyPhone = body.companyPhone
    if (body.companyTaxNumber !== undefined) updateData.companyTaxNumber = body.companyTaxNumber
    if (body.kdvRate !== undefined) updateData.kdvRate = body.kdvRate
    if (body.invoiceDueDays !== undefined) updateData.invoiceDueDays = body.invoiceDueDays
    if (body.currencySymbol !== undefined) updateData.currencySymbol = body.currencySymbol
    if (body.monthlyTarget !== undefined) updateData.monthlyTarget = body.monthlyTarget

    const { data, error } = await supabase
      .from('Settings')
      .update(updateData)
      .eq('id', 'default')
      .select()
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json(
        { error: 'Ayarlar kaydedilirken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Ayarlar kaydedilirken hata oluştu' },
      { status: 500 }
    )
  }
}
