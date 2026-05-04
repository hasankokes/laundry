export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check customer exists
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('id', id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Fetch all records (totals) for this customer
    const { data: records, error: recordsError } = await supabase
      .from('DailyRecord')
      .select('total')
      .eq('customerId', id)

    if (recordsError) {
      console.error('Error fetching records:', recordsError)
      return NextResponse.json(
        { error: 'Bakiye hesaplanırken hata oluştu' },
        { status: 500 }
      )
    }

    // Fetch all payments for this customer
    const { data: payments, error: paymentsError } = await supabase
      .from('Payment')
      .select('amount, date, method, description, id, customerId, createdAt, updatedAt')
      .eq('customerId', id)

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json(
        { error: 'Bakiye hesaplanırken hata oluştu' },
        { status: 500 }
      )
    }

    // Total debit (from DailyRecord totals)
    const totalDebit = (records ?? []).reduce((sum: number, r: any) => sum + r.total, 0)

    // Total credit (from Payment totals)
    const totalCredit = (payments ?? []).reduce((sum: number, p: any) => sum + p.amount, 0)

    // Balance = debit - credit (positive means customer owes money)
    const balance = totalDebit - totalCredit

    // Recent payments (last 10)
    const recentPayments = [...(payments ?? [])]
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
      .slice(0, 10)

    return NextResponse.json({
      totalDebit,
      totalCredit,
      balance,
      recentPayments,
    })
  } catch (error) {
    console.error('Error calculating balance:', error)
    return NextResponse.json(
      { error: 'Bakiye hesaplanırken hata oluştu' },
      { status: 500 }
    )
  }
}
