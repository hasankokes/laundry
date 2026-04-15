import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/customers/[id]/balance - Calculate customer balance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        records: { select: { total: true } },
        payments: { select: { amount: true, date: true, method: true, description: true, id: true, customerId: true, createdAt: true, updatedAt: true } },
      },
    })
    if (!customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Total debit (from DailyRecord totals)
    const totalDebit = customer.records.reduce((sum, r) => sum + r.total, 0)

    // Total credit (from Payment totals)
    const totalCredit = customer.payments.reduce((sum, p) => sum + p.amount, 0)

    // Balance = debit - credit (positive means customer owes money)
    const balance = totalDebit - totalCredit

    // Recent payments (last 10)
    const recentPayments = customer.payments
      .sort((a, b) => b.date.localeCompare(a.date))
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
