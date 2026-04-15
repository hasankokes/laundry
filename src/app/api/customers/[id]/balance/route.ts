import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Use a fresh PrismaClient to avoid stale globalThis cache in dev mode
const prisma = new PrismaClient({ log: ['query'] })

// GET /api/customers/[id]/balance - Calculate customer balance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await prisma.customer.findUnique({ where: { id } })
    if (!customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Total debit (from DailyRecord totals)
    const debitResult = await prisma.dailyRecord.aggregate({
      where: { customerId: id },
      _sum: { total: true },
    })
    const totalDebit = debitResult._sum.total ?? 0

    // Total credit (from Payment totals)
    const creditResult = await prisma.payment.aggregate({
      where: { customerId: id },
      _sum: { amount: true },
    })
    const totalCredit = creditResult._sum.amount ?? 0

    // Balance = debit - credit (positive means customer owes money)
    const balance = totalDebit - totalCredit

    // Recent payments (last 10)
    const recentPayments = await prisma.payment.findMany({
      where: { customerId: id },
      orderBy: { date: 'desc' },
      take: 10,
    })

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
