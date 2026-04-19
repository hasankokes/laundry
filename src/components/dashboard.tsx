'use client'

import { useRecords, useCustomers, useServices, useDashboardData, useBalanceOverview, usePayments } from '@/hooks/use-api'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  Users,
  Shirt,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Target,
  Clock,
  Flame,
  Trophy,
  ArrowUp,
  Wallet,
  AlertTriangle,
  MessageCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts'

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

const CHART_COLORS = [
  '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
  '#10b981', '#f97316', '#06b6d4',
]

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
}

// Custom tooltip for bar chart
function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">Tarih: {label}</p>
        <p className="text-sm font-bold text-primary">
          ₺{payload[0].value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    )
  }
  return null
}

// Custom label for pie chart
function renderPieLabel({ name, percent }: any) {
  if (percent < 0.05) return ''
  return `${name} %${(percent * 100).toFixed(0)}`
}

// Balance Overview sub-component
function BalanceOverview() {
  const { data: balanceData, isLoading } = useBalanceOverview()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 rounded-lg shimmer-gradient" />
        ))}
      </div>
    )
  }

  if (!balanceData || balanceData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Henüz bakiye bilgisi yok
      </p>
    )
  }

  const totalDebt = balanceData.reduce((sum, b) => sum + (b.balance > 0 ? b.balance : 0), 0)
  const totalCredit = balanceData.reduce((sum, b) => sum + (b.balance < 0 ? Math.abs(b.balance) : 0), 0)

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 p-3 border border-rose-200/50 dark:border-rose-900/50">
          <p className="text-[10px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Toplam Alacak</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
            ₺{totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-3 border border-emerald-200/50 dark:border-emerald-900/50">
          <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Toplam Fazla Ödeme</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            ₺{totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Customer balances list */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {balanceData.map((item, idx) => (
          <motion.div
            key={item.customerId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                item.balance > 0 ? "bg-rose-500" : item.balance < 0 ? "bg-emerald-500" : "bg-gray-400"
              )}>
                {item.customerName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.customerName}</p>
                {item.tag && (
                  <p className="text-[10px] text-muted-foreground">{item.tag}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(
                "text-sm font-semibold",
                item.balance > 0 ? "text-rose-600" : item.balance < 0 ? "text-emerald-600" : "text-muted-foreground"
              )}>
                {item.balance > 0 ? '+' : ''}₺{Math.abs(item.balance).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
              </span>
              <Badge variant="outline" className={cn(
                "text-[9px] h-5",
                item.balance > 0 ? "border-rose-300 text-rose-600" : item.balance < 0 ? "border-emerald-300 text-emerald-600" : ""
              )}>
                {item.balance > 0 ? 'Borçlu' : item.balance < 0 ? 'Alacaklı' : 'Borç Yok'}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Overdue Alerts sub-component
function OverdueAlerts({ payments }: { payments: { customerId: string; customerName?: string; customer?: { id: string; name: string; phone: string | null }; amount: number; date: string; method: string }[] }) {
  const { data: balanceData, isLoading } = useBalanceOverview()

  const sendWhatsAppReminder = (customerName: string, balance: number, phone: string | null) => {
    const message = `Merhaba ${customerName}, çamaşırhane hesabınızda ₺${balance.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} tutarında ödeme bulunmaktadır. Ödemenizi yapmanızı rica ederiz.`
    const encodedMessage = encodeURIComponent(message)

    if (phone) {
      // Remove any non-digit characters and ensure it starts with country code
      const cleanPhone = phone.replace(/\D/g, '')
      const whatsappPhone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone
      window.open(`https://wa.me/90${whatsappPhone}?text=${encodedMessage}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-32 rounded-lg shimmer-gradient" />
      </div>
    )
  }

  if (!balanceData) return null

  // Filter customers with outstanding balance (balance > 0)
  const debtors = balanceData.filter(b => b.balance > 0)

  if (debtors.length === 0) return null

  // Calculate last payment date per customer from payments
  const lastPaymentByCustomer: Record<string, { date: string; daysAgo: number }> = {}
  const now = new Date()
  payments.forEach(p => {
    const existing = lastPaymentByCustomer[p.customerId]
    if (!existing || p.date > existing.date) {
      const paymentDate = new Date(p.date + 'T00:00:00')
      const diffTime = now.getTime() - paymentDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      lastPaymentByCustomer[p.customerId] = { date: p.date, daysAgo: diffDays }
    }
  })

  // For customers with no payments, use a very high days-ago number
  const getDaysSinceLastPayment = (customerId: string): number => {
    const lastPayment = lastPaymentByCustomer[customerId]
    if (!lastPayment) return 999 // No payment ever
    return lastPayment.daysAgo
  }

  const getLastPaymentDate = (customerId: string): string | null => {
    const lastPayment = lastPaymentByCustomer[customerId]
    if (!lastPayment) return null
    return new Date(lastPayment.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const getCustomerPhone = (customerId: string): string | null => {
    const payment = payments.find(p => p.customerId === customerId && p.customer?.phone)
    return payment?.customer?.phone ?? null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
    >
      <Card className="overflow-hidden border-rose-200/50 dark:border-rose-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Gecikmiş Ödemeler
            <Badge className="ml-auto bg-rose-500/10 text-rose-600 border-rose-200 text-[10px] font-bold">
              {debtors.length} müşteri
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {debtors.map((item, idx) => {
              const daysAgo = getDaysSinceLastPayment(item.customerId)
              const lastDate = getLastPaymentDate(item.customerId)
              const phone = getCustomerPhone(item.customerId)

              const colorClass = daysAgo > 30
                ? 'text-rose-600 bg-rose-500/10 border-rose-200/50 dark:border-rose-900/50'
                : daysAgo > 15
                ? 'text-amber-600 bg-amber-500/10 border-amber-200/50 dark:border-amber-900/50'
                : 'text-muted-foreground bg-muted/50 border-transparent'

              const dotColor = daysAgo > 30
                ? 'bg-rose-500'
                : daysAgo > 15
                ? 'bg-amber-500'
                : 'bg-gray-400'

              const daysLabel = daysAgo === 999
                ? 'Ödeme yok'
                : daysAgo === 0
                ? 'Bugün'
                : daysAgo === 1
                ? 'Dün'
                : `${daysAgo} gün önce`

              return (
                <motion.div
                  key={item.customerId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={cn(
                    "flex items-center justify-between py-2.5 px-3 rounded-lg border transition-colors",
                    colorClass
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.customerName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{daysLabel}</span>
                        {lastDate && (
                          <span className="text-[10px] text-muted-foreground/70">
                            (Son: {lastDate})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "text-sm font-semibold",
                      daysAgo > 30 ? "text-rose-600" : daysAgo > 15 ? "text-amber-600" : "text-foreground"
                    )}>
                      ₺{item.balance.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        sendWhatsAppReminder(item.customerName, item.balance, phone)
                      }}
                    >
                      <MessageCircle className="w-3 h-3" />
                      Hatırlat
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Recent Payments sub-component
function RecentPayments() {
  const { data: payments, isLoading } = usePayments()
  const { setActiveTab } = useAppStore()

  const methodLabels: Record<string, { label: string; color: string }> = {
    nakit: { label: 'Nakit', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
    kredi_karti: { label: 'Kredi Kartı', color: 'bg-sky-500/10 text-sky-600 border-sky-200' },
    havale: { label: 'Havale', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
    eft: { label: 'EFT', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  }

  const recentPayments = payments?.slice(0, 5) ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-500" />
            Son Ödemeler
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {payments?.length ?? 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-lg shimmer-gradient" />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Henüz ödeme kaydı yok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPayments.map((payment, idx) => {
                const methodInfo = methodLabels[payment.method] ?? { label: payment.method, color: 'bg-muted text-muted-foreground border-border' }
                const paymentDate = new Date(payment.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {payment.customer?.name ?? 'Bilinmiyor'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{paymentDate}</span>
                          <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", methodInfo.color)}>
                            {methodInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 shrink-0">
                      ₺{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                    </span>
                  </motion.div>
                )
              })}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-1 text-xs gap-1 text-primary hover:text-primary/80"
                onClick={() => setActiveTab('customers')}
              >
                Tümünü Gör
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function Dashboard() {
  const { selectedMonth, setSelectedMonth, setActiveTab } = useAppStore()

  const [year, month] = selectedMonth.split('-').map(Number)
  const startDate = `${selectedMonth}-01`
  const endDate = `${selectedMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`

  // Previous month data for comparison
  const prevMonthDate = new Date(year, month - 2, 1)
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`
  const prevStartDate = `${prevMonthStr}-01`
  const prevEndDate = `${prevMonthStr}-${String(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0).getDate()).padStart(2, '0')}`

  const { data: records, isLoading: recordsLoading } = useRecords({ startDate, endDate })
  const { data: prevRecords } = useRecords({ startDate: prevStartDate, endDate: prevEndDate })
  const { data: customers } = useCustomers()
  const { data: services } = useServices()
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData()
  const { data: payments } = usePayments()

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const nextMonth = () => {
    const d = new Date(year, month, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const totalRevenue = records?.reduce((sum, r) => sum + r.total, 0) ?? 0
  const prevRevenue = prevRecords?.reduce((sum, r) => sum + r.total, 0) ?? 0
  const totalQuantity = records?.reduce((sum, r) => sum + r.quantity, 0) ?? 0
  const prevQuantity = prevRecords?.reduce((sum, r) => sum + r.quantity, 0) ?? 0
  const uniqueCustomers = new Set(records?.map(r => r.customerId)).size
  const prevUniqueCustomers = new Set(prevRecords?.map(r => r.customerId)).size

  // Revenue change percentage
  const revenueChange = prevRevenue > 0
    ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
    : totalRevenue > 0 ? 100 : 0
  const quantityChange = prevQuantity > 0
    ? ((totalQuantity - prevQuantity) / prevQuantity) * 100
    : totalQuantity > 0 ? 100 : 0
  const customerChange = prevUniqueCustomers > 0
    ? ((uniqueCustomers - prevUniqueCustomers) / prevUniqueCustomers) * 100
    : uniqueCustomers > 0 ? 100 : 0

  // Today's records
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = records?.filter(r => r.date === today) ?? []
  const todayRevenue = todayRecords.reduce((sum, r) => sum + r.total, 0)

  // Average daily revenue
  const daysWithData = new Set(records?.map(r => r.date)).size
  const avgDailyRevenue = daysWithData > 0 ? totalRevenue / daysWithData : 0

  // Top customers this month
  const customerTotals: Record<string, { name: string; total: number; count: number }> = {}
  records?.forEach(r => {
    if (!customerTotals[r.customerId]) {
      customerTotals[r.customerId] = {
        name: r.customer?.name ?? 'Bilinmiyor',
        total: 0,
        count: 0,
      }
    }
    customerTotals[r.customerId].total += r.total
    customerTotals[r.customerId].count += r.quantity
  })
  const topCustomers = Object.values(customerTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Service distribution for pie chart
  const serviceTotals: Record<string, { name: string; revenue: number; quantity: number }> = {}
  records?.forEach(r => {
    if (!serviceTotals[r.serviceId]) {
      serviceTotals[r.serviceId] = {
        name: r.service?.name ?? 'Bilinmiyor',
        revenue: 0,
        quantity: 0,
      }
    }
    serviceTotals[r.serviceId].revenue += r.total
    serviceTotals[r.serviceId].quantity += r.quantity
  })
  const serviceDistribution = Object.values(serviceTotals)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  // Daily revenue trend for area chart
  const dailyRevenue: Record<string, number> = {}
  records?.forEach(r => {
    if (!dailyRevenue[r.date]) dailyRevenue[r.date] = 0
    dailyRevenue[r.date] += r.total
  })
  const dailyChartData = Object.entries(dailyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({
      date: date.slice(5),
      ciro: revenue,
    }))

  const currentTimestamp = new Date().toLocaleString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-5">
      {/* Month Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between relative overflow-hidden"
      >
        {/* Floating particles background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="float-particle absolute w-1 h-1 rounded-full bg-primary/20"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}
            />
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary/10">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight">
            {monthNames[month - 1]} {year}
          </h2>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
            Aylık Özet
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary/10">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Stats Cards - Gradient */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer border-glow-emerald"
            onClick={() => setActiveTab('reports')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                {prevRevenue > 0 && (
                  <Badge className={cn(
                    "text-[10px] font-bold px-1.5 py-0",
                    revenueChange >= 0
                      ? "bg-white/20 text-white"
                      : "bg-red-500/30 text-white"
                  )}>
                    {revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                    {Math.abs(revenueChange).toFixed(0)}%
                  </Badge>
                )}
              </div>
              {recordsLoading ? (
                <div className="h-7 w-28 rounded-md shimmer-bg" />
              ) : (
                <p className="text-2xl font-bold">
                  ₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </p>
              )}
              <p className="text-sm text-white/80 mt-1 font-medium">Aylık Ciro</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card
            className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all border-glow-amber"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1 text-white/80 text-[10px]">
                  <Zap className="w-3 h-3" />
                  BUGÜN
                </div>
              </div>
              {recordsLoading ? (
                <div className="h-7 w-24 rounded-md shimmer-bg" />
              ) : (
                <p className="text-3xl font-bold">
                  ₺{todayRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </p>
              )}
              <p className="text-sm text-white/80 mt-1 font-medium">Bugünkü Ciro</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card
            className="bg-gradient-to-br from-teal-500 to-teal-600 border-0 text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all cursor-pointer border-glow-teal"
            onClick={() => setActiveTab('customers')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                {prevUniqueCustomers > 0 && customerChange !== 0 && (
                  <Badge className={cn(
                    "text-[10px] font-bold px-1.5 py-0",
                    customerChange >= 0
                      ? "bg-white/20 text-white"
                      : "bg-red-500/30 text-white"
                  )}>
                    {customerChange >= 0 ? '+' : ''}{customerChange.toFixed(0)}%
                  </Badge>
                )}
              </div>
              {recordsLoading ? (
                <div className="h-7 w-16 rounded-md shimmer-bg" />
              ) : (
                <p className="text-3xl font-bold">{uniqueCustomers}</p>
              )}
              <p className="text-sm text-white/80 mt-1 font-medium">Aktif Müşteri</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card
            className="bg-gradient-to-br from-rose-400 to-pink-500 border-0 text-white hover:shadow-lg hover:shadow-rose-500/20 transition-all border-glow-rose"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shirt className="w-4 h-4" />
                </div>
                {prevQuantity > 0 && quantityChange !== 0 && (
                  <Badge className={cn(
                    "text-[10px] font-bold px-1.5 py-0",
                    quantityChange >= 0
                      ? "bg-white/20 text-white"
                      : "bg-red-500/30 text-white"
                  )}>
                    {quantityChange >= 0 ? '+' : ''}{quantityChange.toFixed(0)}%
                  </Badge>
                )}
              </div>
              {recordsLoading ? (
                <div className="h-7 w-16 rounded-md shimmer-bg" />
              ) : (
                <p className="text-3xl font-bold">{totalQuantity.toLocaleString('tr-TR')}</p>
              )}
              <p className="text-sm text-white/80 mt-1 font-medium">Toplam Adet</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Overdue Alerts / Gecikmiş Ödemeler */}
      <OverdueAlerts payments={payments ?? []} />

      {/* A. Weekly Comparison Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Haftalık Karşılaştırma
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dashboardLoading ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-lg shimmer-gradient" />
                <div className="h-20 rounded-lg shimmer-gradient" />
              </div>
            ) : dashboardData ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 text-white">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Bu Hafta</p>
                  <p className="text-xl font-bold mt-1">
                    ₺{dashboardData.weeklyComparison.thisWeek.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 p-3 text-white">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Geçen Hafta</p>
                  <p className="text-xl font-bold mt-1">
                    ₺{dashboardData.weeklyComparison.lastWeek.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ) : null}
            {dashboardData && dashboardData.weeklyComparison.lastWeek > 0 && (
              <div className={cn(
                "flex items-center gap-1.5 mt-3 justify-center",
                dashboardData.weeklyComparison.change >= 0 ? "text-emerald-600" : "text-rose-500"
              )}>
                {dashboardData.weeklyComparison.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="text-sm font-bold">
                  %{Math.abs(dashboardData.weeklyComparison.change).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {dashboardData.weeklyComparison.change >= 0 ? 'artış' : 'azalış'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* B. Streak & Best Day Row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Seri</span>
              </div>
              {dashboardLoading ? (
                <div className="h-7 w-20 rounded-md shimmer-bg" />
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold text-orange-600">{dashboardData?.currentStreak ?? 0}</p>
                  <span className="text-xs text-muted-foreground">gün üst üste</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">En İyi Gün</span>
              </div>
              {dashboardLoading ? (
                <div className="h-7 w-24 rounded-md shimmer-bg" />
              ) : dashboardData?.bestDay ? (
                <div>
                  <p className="text-lg font-bold text-amber-600">
                    ₺{dashboardData.bestDay.amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(dashboardData.bestDay.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* C. Monthly Target Progress */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Aylık Hedef
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dashboardLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-full rounded-full shimmer-gradient" />
                <div className="h-4 w-20 rounded-md shimmer-bg" />
              </div>
            ) : dashboardData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    ₺{dashboardData.monthlyTarget.current.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} / ₺{dashboardData.monthlyTarget.target.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </span>
                  <span className={cn(
                    "font-bold",
                    dashboardData.monthlyTarget.percentage >= 70 ? "text-emerald-600" : "text-amber-500"
                  )}>
                    %{Math.min(dashboardData.monthlyTarget.percentage, 100).toFixed(0)}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(dashboardData.monthlyTarget.percentage, 100)}%` }}
                    transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                    className={cn(
                      "h-full rounded-full",
                      dashboardData.monthlyTarget.percentage >= 70
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                        : "bg-gradient-to-r from-amber-400 to-amber-500"
                    )}
                  />
                </div>
                <p className={cn(
                  "text-[10px]",
                  dashboardData.monthlyTarget.percentage >= 70 ? "text-emerald-600" : "text-amber-500"
                )}>
                  {dashboardData.monthlyTarget.percentage >= 70
                    ? '✅ Hedefin üzerinde'
                    : '⚠️ Hedefin altında'}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Action + Average */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 space-y-1">
          <Button
            className="w-full h-12 text-base gap-2 shadow-md hover:shadow-lg transition-shadow"
            onClick={() => setActiveTab('daily-entry')}
          >
            <PlusCircle className="w-4 h-4" />
            Günlük Kayıt Ekle
          </Button>
          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            Son güncelleme: {currentTimestamp}
          </p>
        </div>
        <Card className="col-span-2 bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Activity className="w-3 h-3" />
              <span className="text-[10px] font-medium">Günlük Ort.</span>
            </div>
            <p className="text-base font-bold text-primary">
              ₺{avgDailyRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart - Area */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Günlük Ciro Trendi
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {daysWithData} gün
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recordsLoading ? (
            <div className="h-48 w-full rounded-lg shimmer-gradient" />
          ) : dailyChartData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    tickFormatter={(val: number) => `₺${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="ciro"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#colorCiro)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Bu ay henüz kayıt yok
            </p>
          )}
        </CardContent>
      </Card>

      {/* Service Distribution Pie Chart */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shirt className="w-4 h-4 text-primary" />
            Hizmet Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recordsLoading ? (
            <div className="h-52 w-full rounded-lg shimmer-gradient" />
          ) : serviceDistribution.length > 0 ? (
            <div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceDistribution}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={35}
                      paddingAngle={3}
                      label={renderPieLabel}
                      labelLine={{ strokeWidth: 1, stroke: 'var(--color-muted-foreground)' }}
                    >
                      {serviceDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend items below chart with colored dots and percentage */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center px-4 pb-2">
                {serviceDistribution.map((item, index) => {
                  const pct = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(0) : '0'
                  return (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground truncate max-w-[80px]">{item.name}</span>
                      <span className="text-xs font-semibold">%{pct}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Bu ay henüz kayıt yok
            </p>
          )}
        </CardContent>
      </Card>

      {/* Today's Records */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Bugünkü Kayıtlar
            <Badge variant="secondary" className="ml-auto">{todayRecords.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {todayRecords.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Bugün henüz kayıt yok</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => setActiveTab('daily-entry')}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Kayıt Ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {todayRecords.map((record, idx) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    >
                      {record.service?.name?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{record.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.service?.name} × {record.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">
                    ₺{record.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            En Çok İş Yapan Müşteriler
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Bu ay henüz kayıt yok
            </p>
          ) : (
            <div className="space-y-2">
              {topCustomers.map((c, i) => {
                const maxTotal = topCustomers[0]?.total || 1
                const barWidth = (c.total / maxTotal) * 100
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center",
                          i === 0 ? "bg-amber-500/20 text-amber-600" :
                          i === 1 ? "bg-gray-400/20 text-gray-500" :
                          i === 2 ? "bg-orange-400/20 text-orange-500" :
                          "bg-primary/10 text-primary"
                        )}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.count.toLocaleString('tr-TR')} adet</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">
                        ₺{c.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                        className={cn(
                          "h-full rounded-full",
                          i === 0 ? "bg-amber-500" :
                          i === 1 ? "bg-gray-400" :
                          i === 2 ? "bg-orange-400" :
                          "bg-primary/60"
                        )}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* D. Revenue by Day of Week */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Haftanın Günlerine Göre Ortalama
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dashboardLoading ? (
              <div className="h-48 w-full rounded-lg shimmer-gradient" />
            ) : dashboardData && dashboardData.revenueByDayOfWeek.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.revenueByDayOfWeek} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="dayBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickFormatter={(val: number) => `₺${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 'Ortalama Ciro']}
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="average" fill="url(#dayBarGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Henüz kayıt yok
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* E. Top Growth Customer */}
      {dashboardData?.topGrowthCustomer && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="overflow-hidden border-emerald-200 dark:border-emerald-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-emerald-500" />
                En Hızlı Büyüyen Müşteri
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold">{dashboardData.topGrowthCustomer.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Bu Ay</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        ₺{dashboardData.topGrowthCustomer.thisMonth.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-muted-foreground/40">→</div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Geçen Ay</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        ₺{dashboardData.topGrowthCustomer.lastMonth.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <ArrowUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <Badge className="mt-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs font-bold">
                    +{dashboardData.topGrowthCustomer.change.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setActiveTab('customers')}>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-teal-500" />
            </div>
            <p className="text-2xl font-bold text-primary">{customers?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Toplam Müşteri</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setActiveTab('services')}>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Shirt className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-primary">{services?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Toplam Hizmet</p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Müşteri Bakiye Özeti
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <BalanceOverview />
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Payments / Son Ödemeler */}
      <RecentPayments />
    </div>
  )
}
