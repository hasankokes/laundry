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
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

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
  const uniqueServices = new Set(records?.map(r => r.serviceId)).size

  // Today's records
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = records?.filter(r => r.date === today) ?? []
  const todayRevenue = todayRecords.reduce((sum, r) => sum + r.total, 0)

  // Recent records (last 5)
  const recentRecords = records?.slice(0, 5) ?? []

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

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">
          {monthNames[month - 1]} {year}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Aylık Ciro</span>
            </div>
            {recordsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-xl font-bold text-emerald-600">
                ₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs font-medium">Bugünkü Ciro</span>
            </div>
            {recordsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-xl font-bold text-amber-600">
                ₺{todayRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Aktif Müşteri</span>
            </div>
            {recordsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-xl font-bold text-teal-600">{uniqueCustomers}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shirt className="w-4 h-4" />
              <span className="text-xs font-medium">Toplam Adet</span>
            </div>
            {recordsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-xl font-bold text-rose-500">{totalQuantity}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action */}
      <Button
        className="w-full h-12 text-base gap-2"
        onClick={() => setActiveTab('daily-entry')}
      >
        <PlusCircle className="w-5 h-5" />
        Günlük Kayıt Ekle
      </Button>

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
                <div
                  key={record.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{record.customer?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.service?.name} × {record.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    ₺{record.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
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
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.count} adet</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">
                    ₺{c.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{customers?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Toplam Müşteri</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{services?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Toplam Hizmet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
