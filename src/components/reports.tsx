'use client'

import { useState } from 'react'
import { useCustomers, useReport } from '@/hooks/use-api'
import { InvoiceDialog } from '@/components/invoice-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  TrendingUp,
  Users,
  CalendarDays,
  Printer,
  Download,
  Receipt,
  Target,
  Activity,
  Shirt,
  ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const CHART_COLORS = ['#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981']

function ReportChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-primary">
          ₺{payload[0].value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    )
  }
  return null
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
}

export function Reports() {
  const today = new Date()
  const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = today.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  const { data: customers } = useCustomers()
  const { data: report, isLoading } = useReport(
    startDate,
    endDate,
    selectedCustomer && selectedCustomer !== 'all' ? selectedCustomer : undefined
  )

  const setThisMonth = () => {
    const now = new Date()
    setStartDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
    setEndDate(now.toISOString().split('T')[0])
  }

  const setLastMonth = () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    setStartDate(`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`)
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
    setEndDate(lastDayOfPrevMonth)
  }

  const setThisWeek = () => {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + 1)
    setStartDate(monday.toISOString().split('T')[0])
    setEndDate(now.toISOString().split('T')[0])
  }

  const setLast30Days = () => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
    setEndDate(now.toISOString().split('T')[0])
  }

  const handlePrint = () => { window.print() }

  const handleExportCSV = () => {
    if (!report) return
    const lines: string[] = []
    lines.push('Çamaşırhane Raporu')
    lines.push(`Tarih Aralığı: ${startDate} - ${endDate}`)
    lines.push('')
    lines.push('ÖZET')
    lines.push(`Toplam Ciro,${report.summary.totalRevenue}`)
    lines.push(`Toplam Kayıt,${report.summary.totalRecordCount}`)
    lines.push(`Müşteri Sayısı,${report.summary.uniqueCustomers}`)
    lines.push(`Toplam Adet,${report.summary.totalQuantity}`)
    lines.push('')
    lines.push('HİZMET BAZLI ÖZET')
    lines.push('Hizmet,Birim,Toplam Adet,Kayıt Sayısı,Toplam Ciro')
    report.byService.forEach(item => {
      lines.push(`${item.serviceName},${item.unit},${item.totalQuantity},${item.recordCount},${item.totalRevenue}`)
    })
    lines.push('')
    lines.push('MÜŞTERİ BAZLI DETAY')
    lines.push('Müşteri,Toplam Ciro')
    report.byCustomer.forEach(customer => {
      lines.push(`${customer.customerName},${customer.totalRevenue}`)
      customer.services.forEach(svc => {
        lines.push(`  ${svc.serviceName},${svc.quantity} adet,${svc.revenue}`)
      })
    })
    lines.push('')
    lines.push('GÜNLÜK ÖZET')
    lines.push('Tarih,Kayıt Sayısı,Ciro')
    report.byDate.forEach(item => {
      lines.push(`${item.date},${item.recordCount},${item.totalRevenue}`)
    })
    const csvContent = '\uFEFF' + lines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `camasirhane-rapor-${startDate}-${endDate}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Avg daily revenue
  const daysWithData = report?.byDate?.length ?? 0
  const avgDaily = daysWithData > 0 && report ? report.summary.totalRevenue / daysWithData : 0

  return (
    <div className="space-y-4">
      {/* Date Range Selector */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Tarih Aralığı
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Başlangıç</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Bitiş</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Quick Selectors - pill style */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: 'Bu Hafta', onClick: setThisWeek },
              { label: 'Bu Ay', onClick: setThisMonth },
              { label: 'Son 30 Gün', onClick: setLast30Days },
              { label: 'Geçen Ay', onClick: setLastMonth },
            ].map(btn => (
              <Button key={btn.label} variant="outline" size="sm" onClick={btn.onClick} className="text-xs rounded-full px-3 h-7">
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Customer Filter */}
          <div className="space-y-1">
            <Label className="text-xs">Müşteri</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm Müşteriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Müşteriler</SelectItem>
                {customers?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Gradient like Dashboard */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/50" />
                  </div>
                  <p className="text-2xl font-bold">
                    ₺{report.summary.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-white/70 mt-0.5">Toplam Ciro</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0 text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <Badge className="bg-white/20 text-white text-[10px]">Günlük Ort. ₺{avgDaily.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{report.summary.totalRecordCount}</p>
                  <p className="text-[11px] text-white/70 mt-0.5">Toplam Kayıt</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
              <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{report.summary.uniqueCustomers}</p>
                  <p className="text-[11px] text-white/70 mt-0.5">Müşteri Sayısı</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
              <Card className="bg-gradient-to-br from-rose-400 to-pink-500 border-0 text-white hover:shadow-lg hover:shadow-rose-500/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{report.summary.totalQuantity.toLocaleString('tr-TR')}</p>
                  <p className="text-[11px] text-white/70 mt-0.5">Toplam Adet</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleExportCSV}>
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Yazdır
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => setInvoiceOpen(true)}
              disabled={!selectedCustomer || selectedCustomer === 'all'}
              title={!selectedCustomer || selectedCustomer === 'all' ? 'Fatura için müşteri seçin' : 'Fatura oluştur'}
            >
              <Receipt className="w-4 h-4" />
              Fatura
            </Button>
          </div>

          <InvoiceDialog
            open={invoiceOpen}
            onOpenChange={setInvoiceOpen}
            startDate={startDate}
            endDate={endDate}
            customerId={selectedCustomer && selectedCustomer !== 'all' ? selectedCustomer : ''}
          />

          {/* Revenue Area Chart */}
          {report.byDate.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Ciro Trendi
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {daysWithData} gün
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={report.byDate.map(d => ({
                        date: d.date.slice(5),
                        ciro: d.totalRevenue,
                      }))}
                      margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
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
                      <Tooltip content={<ReportChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="ciro"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        fill="url(#reportGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* By Service - with color dots and progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shirt className="w-4 h-4 text-primary" />
                Hizmet Bazlı Özet
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {report.byService.length} hizmet
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {report.byService.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Bu dönemde kayıt yok</p>
              ) : (
                <div className="space-y-3">
                  {report.byService.map((item, idx) => {
                    const maxRevenue = report.byService[0]?.totalRevenue || 1
                    const barWidth = (item.totalRevenue / maxRevenue) * 100
                    const revenuePct = report.summary.totalRevenue > 0
                      ? ((item.totalRevenue / report.summary.totalRevenue) * 100).toFixed(1)
                      : '0'
                    return (
                      <motion.div
                        key={item.serviceId}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{item.serviceName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.totalQuantity.toLocaleString('tr-TR')} {item.unit} • {item.recordCount} kayıt
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">%{revenuePct}</span>
                            <p className="text-sm font-semibold text-emerald-600">
                              ₺{item.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ delay: 0.2 + idx * 0.05, duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] + '99' }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Distribution Mini Pie */}
          {report.byService.length > 1 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Dağılım
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.byService.map(s => ({ name: s.serviceName, value: s.totalRevenue }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        innerRadius={28}
                        paddingAngle={3}
                      >
                        {report.byService.map((_, index) => (
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
              </CardContent>
            </Card>
          )}

          {/* By Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Müşteri Bazlı Detay
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {report.byCustomer.length} müşteri
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {report.byCustomer.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Bu dönemde kayıt yok</p>
              ) : (
                <div className="space-y-3">
                  {report.byCustomer.map((customer, idx) => {
                    const maxCustRev = report.byCustomer[0]?.totalRevenue || 1
                    const barWidth = (customer.totalRevenue / maxCustRev) * 100
                    return (
                      <motion.div
                        key={customer.customerId}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                              {idx + 1}
                            </div>
                            <p className="text-sm font-semibold truncate">{customer.customerName}</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-600 shrink-0">
                            ₺{customer.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="ml-4 space-y-1">
                          {customer.services.map((svc) => (
                            <div key={svc.serviceId} className="flex items-center justify-between py-1.5 px-2 text-xs hover:bg-muted/50 rounded transition-colors">
                              <span className="text-muted-foreground">
                                {svc.serviceName} × {svc.quantity}
                              </span>
                              <span className="font-medium">
                                ₺{svc.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden ml-4">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ delay: 0.3 + idx * 0.05, duration: 0.5 }}
                            className="h-full bg-primary/40 rounded-full"
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Date - Unified responsive */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Günlük Özet
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {daysWithData} gün
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {report.byDate.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Bu dönemde kayıt yok</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {report.byDate.map((item, idx) => {
                    const maxDateRev = report.byDate[0]?.totalRevenue || 1
                    // Find the actual max for the bar
                    const actualMax = Math.max(...report.byDate.map(d => d.totalRevenue))
                    const barWidth = actualMax > 0 ? (item.totalRevenue / actualMax) * 100 : 0
                    return (
                      <motion.div
                        key={item.date}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="min-w-[70px]">
                          <p className="text-xs font-medium">{item.date.slice(5)}</p>
                          <p className="text-[10px] text-muted-foreground">{item.recordCount} kayıt</p>
                        </div>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ delay: 0.2 + idx * 0.03, duration: 0.4 }}
                            className="h-full bg-primary/50 rounded-full"
                          />
                        </div>
                        <p className="text-xs font-semibold text-emerald-600 shrink-0 min-w-[70px] text-right">
                          ₺{item.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Tarih aralığı seçerek rapor oluşturun</p>
            <p className="text-xs text-muted-foreground mt-1">Yukarıdan tarih ve müşteri seçin</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
