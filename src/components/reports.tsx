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
  BarChart3,
  Receipt,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Custom tooltip for bar chart - defined outside component
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

  // Quick date range selectors
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

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!report) return

    const lines: string[] = []
    lines.push('Çamaşırhane Raporu')
    lines.push(`Tarih Aralığı: ${startDate} - ${endDate}`)
    lines.push('')

    // Summary
    lines.push('ÖZET')
    lines.push(`Toplam Ciro,${report.summary.totalRevenue}`)
    lines.push(`Toplam Kayıt,${report.summary.totalRecordCount}`)
    lines.push(`Müşteri Sayısı,${report.summary.uniqueCustomers}`)
    lines.push(`Toplam Adet,${report.summary.totalQuantity}`)
    lines.push('')

    // By Service
    lines.push('HİZMET BAZLI ÖZET')
    lines.push('Hizmet,Birim,Toplam Adet,Kayıt Sayısı,Toplam Ciro')
    report.byService.forEach(item => {
      lines.push(`${item.serviceName},${item.unit},${item.totalQuantity},${item.recordCount},${item.totalRevenue}`)
    })
    lines.push('')

    // By Customer
    lines.push('MÜŞTERİ BAZLI DETAY')
    lines.push('Müşteri,Toplam Ciro')
    report.byCustomer.forEach(customer => {
      lines.push(`${customer.customerName},${customer.totalRevenue}`)
      customer.services.forEach(svc => {
        lines.push(`  ${svc.serviceName},${svc.quantity} adet,${svc.revenue}`)
      })
    })
    lines.push('')

    // By Date
    lines.push('GÜNLÜK ÖZET')
    lines.push('Tarih,Kayıt Sayısı,Ciro')
    report.byDate.forEach(item => {
      lines.push(`${item.date},${item.recordCount},${item.totalRevenue}`)
    })

    const csvContent = '\uFEFF' + lines.join('\n')  // BOM for Turkish chars
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `camasirhane-rapor-${startDate}-${endDate}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="space-y-4">
      {/* Date Range Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Tarih Aralığı
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Başlangıç</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Bitiş</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Selectors */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={setThisWeek} className="flex-1 text-xs">
              Bu Hafta
            </Button>
            <Button variant="outline" size="sm" onClick={setThisMonth} className="flex-1 text-xs">
              Bu Ay
            </Button>
            <Button variant="outline" size="sm" onClick={setLastMonth} className="flex-1 text-xs">
              Geçen Ay
            </Button>
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

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium">Toplam Ciro</span>
                </div>
                <p className="text-lg font-bold text-emerald-600">
                  ₺{report.summary.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="w-4 h-4 text-teal-500" />
                  <span className="text-xs font-medium">Toplam Kayıt</span>
                </div>
                <p className="text-lg font-bold text-teal-600">
                  {report.summary.totalRecordCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium">Müşteri Sayısı</span>
                </div>
                <p className="text-lg font-bold text-amber-600">
                  {report.summary.uniqueCustomers}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-rose-400 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CalendarDays className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-medium">Toplam Adet</span>
                </div>
                <p className="text-lg font-bold text-rose-500">
                  {report.summary.totalQuantity.toLocaleString('tr-TR')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleExportCSV}>
              <Download className="w-4 h-4" />
              CSV İndir
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
              Fatura Oluştur
            </Button>
          </div>

          {/* Invoice Dialog */}
          <InvoiceDialog
            open={invoiceOpen}
            onOpenChange={setInvoiceOpen}
            startDate={startDate}
            endDate={endDate}
            customerId={selectedCustomer && selectedCustomer !== 'all' ? selectedCustomer : ''}
          />

          {/* Revenue Chart */}
          {report.byDate.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Ciro Trendi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.byDate.map(d => ({
                        date: d.date.slice(5),
                        ciro: d.totalRevenue,
                      }))}
                      margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                    >
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
                      <Bar dataKey="ciro" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* By Service */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Hizmet Bazlı Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {report.byService.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Bu dönemde kayıt yok
                </p>
              ) : (
                <div className="space-y-2">
                  {report.byService.map((item, idx) => {
                    const maxRevenue = report.byService[0]?.totalRevenue || 1
                    const barWidth = (item.totalRevenue / maxRevenue) * 100
                    return (
                      <div key={item.serviceId} className="py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="text-sm font-medium">{item.serviceName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.totalQuantity} {item.unit} • {item.recordCount} kayıt
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-emerald-600">
                            ₺{item.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Müşteri Bazlı Detay
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {report.byCustomer.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Bu dönemde kayıt yok
                </p>
              ) : (
                <div className="space-y-4">
                  {report.byCustomer.map((customer) => (
                    <div key={customer.customerId} className="space-y-2">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-primary/5">
                        <p className="text-sm font-semibold">{customer.customerName}</p>
                        <p className="text-sm font-bold text-emerald-600">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Date Table (Desktop) */}
          <Card className="hidden md:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Günlük Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {report.byDate.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Bu dönemde kayıt yok
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">Kayıt</TableHead>
                      <TableHead className="text-right">Ciro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byDate.map((item) => (
                      <TableRow key={item.date} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.date}</TableCell>
                        <TableCell className="text-right">{item.recordCount}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          ₺{item.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* By Date Mobile */}
          <Card className="md:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Günlük Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {report.byDate.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Bu dönemde kayıt yok
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {report.byDate.map((item) => (
                    <div key={item.date} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{item.date}</p>
                        <p className="text-xs text-muted-foreground">{item.recordCount} kayıt</p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">
                        ₺{item.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Tarih aralığı seçerek rapor oluşturun
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
