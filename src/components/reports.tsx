'use client'

import { useState, useEffect } from 'react'
import { useCustomers, useReport } from '@/hooks/use-api'
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
} from 'lucide-react'

export function Reports() {
  const today = new Date()
  const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = today.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')

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
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Toplam Ciro</span>
                </div>
                <p className="text-lg font-bold text-emerald-600">
                  ₺{report.summary.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-teal-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Toplam Kayıt</span>
                </div>
                <p className="text-lg font-bold text-teal-600">
                  {report.summary.totalRecordCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Müşteri Sayısı</span>
                </div>
                <p className="text-lg font-bold text-amber-600">
                  {report.summary.uniqueCustomers}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-rose-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs">Toplam Adet</span>
                </div>
                <p className="text-lg font-bold text-rose-500">
                  {report.summary.totalQuantity}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Print Button */}
          <Button variant="outline" className="w-full gap-2 print:hidden" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Raporu Yazdır
          </Button>

          {/* By Service */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Hizmet Bazlı Özet</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {report.byService.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Bu dönemde kayıt yok
                </p>
              ) : (
                <div className="space-y-2">
                  {report.byService.map((item) => (
                    <div key={item.serviceId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Müşteri Bazlı Detay</CardTitle>
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
                          <div key={svc.serviceId} className="flex items-center justify-between py-1.5 px-2 text-xs">
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
              <CardTitle className="text-sm font-semibold">Günlük Özet</CardTitle>
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
                      <TableRow key={item.date}>
                        <TableCell className="font-medium">{item.date}</TableCell>
                        <TableCell className="text-right">{item.recordCount}</TableCell>
                        <TableCell className="text-right font-semibold">
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
              <CardTitle className="text-sm font-semibold">Günlük Özet</CardTitle>
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
                      <p className="text-sm font-semibold">
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
