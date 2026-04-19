import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Fetch customers, all records, and all payments in parallel
    const [
      { data: customers, error: customersError },
      { data: records, error: recordsError },
      { data: payments, error: paymentsError },
    ] = await Promise.all([
      supabase
        .from('Customer')
        .select('id, name, phone, tag')
        .order('name', { ascending: true }),
      supabase
        .from('DailyRecord')
        .select('customerId, total'),
      supabase
        .from('Payment')
        .select('customerId, amount'),
    ])

    if (customersError || recordsError || paymentsError) {
      console.error('Error fetching balances:', customersError || recordsError || paymentsError)
      return NextResponse.json(
        { error: 'Bakiye bilgileri yüklenemedi' },
        { status: 500 }
      )
    }

    // Group records by customerId
    const recordsByCustomer: Record<string, number> = {}
    ;(records ?? []).forEach(r => {
      if (!recordsByCustomer[r.customerId]) recordsByCustomer[r.customerId] = 0
      recordsByCustomer[r.customerId] += r.total
    })

    // Group payments by customerId
    const paymentsByCustomer: Record<string, number> = {}
    ;(payments ?? []).forEach(p => {
      if (!paymentsByCustomer[p.customerId]) paymentsByCustomer[p.customerId] = 0
      paymentsByCustomer[p.customerId] += p.amount
    })

    const balances = (customers ?? []).map(customer => {
      const totalDebit = recordsByCustomer[customer.id] ?? 0
      const totalCredit = paymentsByCustomer[customer.id] ?? 0
      const balance = totalDebit - totalCredit

      return {
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        tag: customer.tag,
        totalDebit,
        totalCredit,
        balance,
      }
    })

    // Sort by balance descending (highest debt first)
    balances.sort((a, b) => b.balance - a.balance)

    return NextResponse.json(balances)
  } catch (error) {
    console.error('Error fetching balances:', error)
    return NextResponse.json(
      { error: 'Bakiye bilgileri yüklenemedi' },
      { status: 500 }
    )
  }
}
