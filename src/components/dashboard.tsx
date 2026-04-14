'use client'

import { useRecords, useCustomers, useServices } from '@/hooks/use-api'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
} from 'recharts'

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

const CHART_COLORS = [
  '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6',
  '#ec4899', '#10b981', '#f97316',
]

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
}

// Custom tooltip for bar chart - defined outside component to avoid re-creation
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

// Custom label for pie chart - defined outside component
function renderPieLabel({ name, percent }: any) {
  if (percent < 0.05) return ''
  return `${name} %${(percent * 100).toFixed(0)}`
}

export function Dashboard() {
  const { selectedMonth, setSelectedMonth, setActiveTab } = useAppStore()

  const [year, month] = selectedMonth.split('-').map(Number)
  const startDate = `${selectedMonth}-01`
  const endDate = `${selectedMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`

  const { data: records, isLoading: recordsLoading } = useRecords({ startDate, endDate })
  const { data: customers } = useCustomers()
  const { data: services } = useServices()

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const nextMonth = () => {
    const d = new Date(year, month, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const totalRevenue = records?.reduce((sum, r) => sum + r.total, 0) ?? 0
  const totalQuantity = records?.reduce((sum, r) => sum + r.quantity, 0) ?? 0
  const uniqueCustomers = new Set(records?.map(r => r.customerId)).size

  // Today's records
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = records?.filter(r => r.date === today) ?? []
  const todayRevenue = todayRecords.reduce((sum, r) => sum + r.total, 0)

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

  // Daily revenue trend for bar chart
  const dailyRevenue: Record<string, number> = {}
  records?.forEach(r => {
    if (!dailyRevenue[r.date]) dailyRevenue[r.date] = 0
    dailyRevenue[r.date] += r.total
  })
  const dailyChartData = Object.entries(dailyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({
      date: date.slice(5), // MM-DD format
      ciro: revenue,
    }))

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary/10">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold tracking-tight">
          {monthNames[month - 1]} {year}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary/10">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('reports')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="text-xs font-medium">Aylık Ciro</span>
              </div>
              {recordsLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <p className="text-xl font-bold text-emerald-600">
                    ₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </p>
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-xs font-medium">Bugünkü Ciro</span>
              </div>
              {recordsLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-xl font-bold text-amber-600">
                  ₺{todayRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('customers')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <div className="w-6 h-6 rounded-md bg-teal-500/10 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <span className="text-xs font-medium">Aktif Müşteri</span>
              </div>
              {recordsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-xl font-bold text-teal-600">{uniqueCustomers}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-rose-400 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <div className="w-6 h-6 rounded-md bg-rose-400/10 flex items-center justify-center">
                  <Shirt className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-xs font-medium">Toplam Adet</span>
              </div>
              {recordsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-xl font-bold text-rose-500">{totalQuantity.toLocaleString('tr-TR')}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Action */}
      <Button
        className="w-full h-12 text-base gap-2 shadow-md hover:shadow-lg transition-shadow"
        onClick={() => setActiveTab('daily-entry')}
      >
        <PlusCircle className="w-5 h-5" />
        Günlük Kayıt Ekle
      </Button>

      {/* Revenue Trend Chart */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Günlük Ciro Trendi
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recordsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : dailyChartData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                  <Bar
                    dataKey="ciro"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
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
            <Skeleton className="h-52 w-full" />
          ) : serviceDistribution.length > 0 ? (
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
            <p className="text-sm text-muted-foreground text-center py-4">
              Bugün henüz kayıt yok
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {todayRecords.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{record.customer?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.service?.name} × {record.quantity}
                    </p>
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
            <Users className="w-4 h-4 text-primary" />
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
              {topCustomers.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
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
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('customers')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{customers?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Toplam Müşteri</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('services')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{services?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Toplam Hizmet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


