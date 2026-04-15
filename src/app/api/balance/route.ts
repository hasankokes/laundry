import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: {
        records: {
          select: { total: true }
        },
        payments: {
          select: { amount: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    const balances = customers.map(customer => {
      const totalDebit = customer.records.reduce((sum, r) => sum + r.total, 0)
      const totalCredit = customer.payments.reduce((sum, p) => sum + p.amount, 0)
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
    return NextResponse.json(
      { error: 'Bakiye bilgileri yüklenemedi' },
      { status: 500 }
    )
  }
}
