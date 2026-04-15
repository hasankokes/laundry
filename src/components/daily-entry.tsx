'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useCustomers, useServices, usePrices, useCreateRecord, useRecords, useDeleteRecord, useUpdateRecord } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  PlusCircle, Trash2, Calendar, Search, X, Check,
  ChevronLeft, ChevronRight, Copy, StickyNote, TrendingUp,
  RotateCcw, Zap, ChevronDown, GripVertical, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface ServiceEntry {
  serviceId: string
  quantity: number
  unitPrice: number
}

const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const weekDayAbbr = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dayName = dayNames[date.getDay()]
  return `${d}.${m}.${y} ${dayName}`
}

function getDateStr(date: Date) {
  return date.toISOString().split('T')[0]
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

export function DailyEntry() {
  const today = useMemo(() => getDateStr(new Date()), [])
  const [currentTime, setCurrentTime] = useState('')
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(1)

  // Batch entry state
  const [batchEntries, setBatchEntries] = useState<ServiceEntry[]>([
    { serviceId: '', quantity: 1, unitPrice: 0 }
  ])
  const [batchNotes, setBatchNotes] = useState('')

  // Repeat Yesterday state
  const [repeatDialogOpen, setRepeatDialogOpen] = useState(false)

  // Quick Entry state
  const [quickEntryOpen, setQuickEntryOpen] = useState(false)
  const [quickQuantities, setQuickQuantities] = useState<Record<string, Record<string, number>>>({})

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const { data: customers, isLoading: customersLoading } = useCustomers()
  const { data: services, isLoading: servicesLoading } = useServices()
  const { data: prices } = usePrices(selectedCustomer !== 'all' && selectedCustomer ? selectedCustomer : undefined)
  const { data: records, isLoading: recordsLoading } = useRecords({ date: selectedDate })
  const createRecord = useCreateRecord()
  const deleteRecord = useDeleteRecord()
  const updateRecord = useUpdateRecord()

  // Yesterday's records for "Repeat Yesterday" feature
  const yesterdayDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() - 1)
    return getDateStr(date)
  }, [selectedDate])

  const { data: yesterdayRecords } = useRecords({ date: yesterdayDate })

  // Quick entry: recent records (last 7 days) to determine active customers & top services
  const sevenDaysAgo = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return getDateStr(date)
  }, [])

  const { data: recentRecords } = useRecords({ startDate: sevenDaysAgo, endDate: today })

  const isToday = selectedDate === today
  const hasNoRecordsToday = !records || records.length === 0
  const canRepeatYesterday = isToday && hasNoRecordsToday && !!yesterdayRecords && yesterdayRecords.length > 0

  // Active customers: customers with records in the last 7 days
  const activeCustomers = useMemo(() => {
    if (!recentRecords || !customers) return []
    const customerIds = new Set(recentRecords.map(r => r.customerId))
    return customers.filter(c => customerIds.has(c.id))
  }, [recentRecords, customers])

  // Top 3 services: most used services in last 7 days
  const topServices = useMemo(() => {
    if (!recentRecords || !services) return []
    const serviceCount: Record<string, number> = {}
    for (const r of recentRecords) {
      serviceCount[r.serviceId] = (serviceCount[r.serviceId] || 0) + 1
    }
    const sorted = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => services.find(s => s.id === id))
      .filter(Boolean) as typeof services
    return sorted
  }, [recentRecords, services])

  // Date navigation
  const navigateDate = (direction: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + direction)
    setSelectedDate(getDateStr(date))
  }

  // Week days for the week-day selector strip
  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const selected = new Date(y, m - 1, d)
    const monday = getMonday(selected)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push({
        date: getDateStr(day),
        abbr: weekDayAbbr[i],
        dayNum: day.getDate(),
        isToday: getDateStr(day) === today,
        isSelected: getDateStr(day) === selectedDate,
      })
    }
    return days
  }, [selectedDate, today])

  // Filter records by selected customer or show all
  const filteredRecords = selectedCustomer && selectedCustomer !== 'all'
    ? records?.filter(r => r.customerId === selectedCustomer)
    : records

  // Search filter
  const displayedRecords = searchQuery
    ? filteredRecords?.filter(r =>
        r.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.service?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredRecords

  const getPriceForService = (serviceId: string, customerId?: string) => {
    if (customerId && customerId !== 'all') {
      const customPrice = prices?.find(p => p.serviceId === serviceId)
      if (customPrice) return customPrice.price
    }
    const service = services?.find(s => s.id === serviceId)
    return service?.defaultPrice ?? 0
  }

  // Get price for quick entry (fetches from all prices if needed)
  const getQuickPrice = useCallback((customerId: string, serviceId: string) => {
    // Check customer-specific prices from recent records
    if (recentRecords) {
      const match = recentRecords.find(r => r.customerId === customerId && r.serviceId === serviceId)
      if (match) return match.unitPrice
    }
    const service = services?.find(s => s.id === serviceId)
    return service?.defaultPrice ?? 0
  }, [recentRecords, services])

  const handleBatchSubmit = async () => {
    if (!selectedCustomer || selectedCustomer === 'all') {
      toast.error('Lütfen müşteri seçin')
      return
    }

    const validEntries = batchEntries.filter(e => e.serviceId && e.quantity > 0)
    if (validEntries.length === 0) {
      toast.error('En az bir hizmet ekleyin')
      return
    }

    try {
      for (const entry of validEntries) {
        await createRecord.mutateAsync({
          customerId: selectedCustomer,
          serviceId: entry.serviceId,
          date: selectedDate,
          quantity: entry.quantity,
          unitPrice: entry.unitPrice,
          notes: batchNotes?.trim() || undefined,
        })
      }
      toast.success(`${validEntries.length} kayıt eklendi`)
      setDialogOpen(false)
      setBatchEntries([{ serviceId: '', quantity: 1, unitPrice: 0 }])
      setBatchNotes('')
    } catch {
      toast.error('Kayıt eklenirken hata oluştu')
    }
  }

  const addBatchEntry = () => {
    setBatchEntries([...batchEntries, { serviceId: '', quantity: 1, unitPrice: 0 }])
  }

  const removeBatchEntry = (index: number) => {
    if (batchEntries.length <= 1) return
    setBatchEntries(batchEntries.filter((_, i) => i !== index))
  }

  const updateBatchEntry = (index: number, field: keyof ServiceEntry, value: string | number) => {
    const newEntries = [...batchEntries]
    if (field === 'serviceId') {
      newEntries[index].serviceId = value as string
      newEntries[index].unitPrice = getPriceForService(value as string, selectedCustomer)
    } else if (field === 'quantity') {
      newEntries[index].quantity = typeof value === 'string' ? parseInt(value) || 1 : value
    } else if (field === 'unitPrice') {
      newEntries[index].unitPrice = typeof value === 'string' ? parseFloat(value) || 0 : value
    }
    setBatchEntries(newEntries)
  }

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecord.mutateAsync(id)
      toast.success('Kayıt silindi')
    } catch {
      toast.error('Kayıt silinirken hata oluştu')
    }
  }

  const handleUpdateQuantity = async (id: string) => {
    try {
      await updateRecord.mutateAsync({ id, quantity: editQuantity })
      toast.success('Kayıt güncellendi')
      setEditingId(null)
    } catch {
      toast.error('Kayıt güncellenirken hata oluştu')
    }
  }

  const handleDuplicateRecord = async (record: any) => {
    try {
      await createRecord.mutateAsync({
        customerId: record.customerId,
        serviceId: record.serviceId,
        date: selectedDate,
        quantity: record.quantity,
        unitPrice: record.unitPrice,
        notes: record.notes || undefined,
      })
      toast.success('Kayıt kopyalandı')
    } catch {
      toast.error('Kayıt kopyalanırken hata oluştu')
    }
  }

  // Repeat Yesterday handler
  const handleRepeatYesterday = async () => {
    if (!yesterdayRecords || yesterdayRecords.length === 0) return

    try {
      for (const record of yesterdayRecords) {
        await createRecord.mutateAsync({
          customerId: record.customerId,
          serviceId: record.serviceId,
          date: selectedDate,
          quantity: record.quantity,
          unitPrice: record.unitPrice,
          notes: record.notes || undefined,
        })
      }
      toast.success(`${yesterdayRecords.length} kayıt bugüne kopyalandı`)
      setRepeatDialogOpen(false)
    } catch {
      toast.error('Kayıtlar kopyalanırken hata oluştu')
    }
  }

  // Quick Entry handlers
  const updateQuickQuantity = (customerId: string, serviceId: string, value: number) => {
    setQuickQuantities(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        [serviceId]: value,
      }
    }))
  }

  const handleQuickSave = async () => {
    const entries: { customerId: string; serviceId: string; quantity: number; unitPrice: number }[] = []

    for (const [customerId, services] of Object.entries(quickQuantities)) {
      for (const [serviceId, quantity] of Object.entries(services)) {
        if (quantity > 0) {
          entries.push({
            customerId,
            serviceId,
            quantity,
            unitPrice: getQuickPrice(customerId, serviceId),
          })
        }
      }
    }

    if (entries.length === 0) {
      toast.error('En az bir giriş yapın')
      return
    }

    try {
      for (const entry of entries) {
        await createRecord.mutateAsync({
          customerId: entry.customerId,
          serviceId: entry.serviceId,
          date: selectedDate,
          quantity: entry.quantity,
          unitPrice: entry.unitPrice,
        })
      }
      toast.success(`${entries.length} kayıt eklendi`)
      setQuickQuantities({})
    } catch {
      toast.error('Kayıtlar eklenirken hata oluştu')
    }
  }

  const batchTotal = batchEntries.reduce((sum, e) => sum + (e.quantity * e.unitPrice), 0)
  const dayTotal = displayedRecords?.reduce((sum, r) => sum + r.total, 0) ?? 0

  // Group records by customer
  const recordsByCustomer = displayedRecords?.reduce((acc, r) => {
    const key = r.customerId
    if (!acc[key]) {
      acc[key] = {
        name: r.customer?.name ?? 'Bilinmiyor',
        records: [],
        total: 0,
      }
    }
    acc[key].records.push(r)
    acc[key].total += r.total
    return acc
  }, {} as Record<string, { name: string; records: typeof displayedRecords; total: number }>)

  return (
    <div className="space-y-4">
      {/* Current Time Indicator */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-medium tabular-nums">{currentTime}</span>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => navigateDate(-1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="pl-9 text-center font-medium"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => navigateDate(1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        {!isToday && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => setSelectedDate(today)}
          >
            Bugün
          </Button>
        )}
      </div>

      {/* Date Display */}
      <div className="text-center">
        <p className="text-sm font-semibold text-muted-foreground">
          {formatDisplayDate(selectedDate)}
        </p>
      </div>

      {/* Week Day Selector Strip */}
      <div className="flex gap-1 justify-center">
        {weekDays.map(day => (
          <Button
            key={day.date}
            variant={day.isSelected ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "flex flex-col items-center gap-0 h-auto py-1.5 px-2 min-w-[40px] relative",
              day.isSelected && "bg-gradient-to-b from-primary to-primary/90 ring-2 ring-primary/30 ring-offset-1"
            )}
            onClick={() => setSelectedDate(day.date)}
          >
            <span className="text-[10px] font-medium leading-tight">{day.abbr}</span>
            <span className="text-sm font-bold leading-tight">{day.dayNum}</span>
            {day.isToday && !day.isSelected && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </Button>
        ))}
      </div>

      {/* Customer Filter */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Müşteriler</SelectItem>
              {customers?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Kayıt ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button className="flex-1 h-12 gap-2 relative" onClick={() => setDialogOpen(true)}>
          <PlusCircle className="w-5 h-5" />
          Yeni Kayıt Ekle
          {hasNoRecordsToday && isToday && (
            <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-white pulse-dot-anim" />
          )}
        </Button>
        {canRepeatYesterday && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Button
              variant="outline"
              className="h-12 gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950"
              onClick={() => setRepeatDialogOpen(true)}
            >
              <RotateCcw className="w-5 h-5" />
              <span className="hidden sm:inline">Dünü Tekrarla</span>
              <span className="sm:hidden">Dünün</span>
            </Button>
          </motion.div>
        )}
      </div>

      {/* Quick Entry Section */}
      {activeCustomers.length > 0 && topServices.length > 0 && (
        <Collapsible open={quickEntryOpen} onOpenChange={setQuickEntryOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/5"
            >
              <Zap className="w-4 h-4" />
              Hızlı Giriş
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {activeCustomers.length} müşteri
              </Badge>
              <motion.div
                animate={{ rotate: quickEntryOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-primary/20">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Hızlı Giriş - Toplu Kayıt
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {/* Quick Entry Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">
                            Müşteri
                          </th>
                          {topServices.map(service => (
                            <th key={service.id} className="text-center py-2 px-1 font-medium text-muted-foreground text-xs min-w-[70px]">
                              {service.name}
                              <br />
                              <span className="text-[10px] text-muted-foreground/70">
                                ({service.unit})
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeCustomers.map(customer => (
                          <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 px-2 text-sm font-medium max-w-[120px] truncate">
                              {customer.name}
                            </td>
                            {topServices.map(service => (
                              <td key={service.id} className="py-1.5 px-1 text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  value={quickQuantities[customer.id]?.[service.id] ?? 0}
                                  onChange={(e) => updateQuickQuantity(
                                    customer.id,
                                    service.id,
                                    parseInt(e.target.value) || 0
                                  )}
                                  className="h-8 w-full text-center text-sm p-1"
                                  placeholder="0"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Quick Entry Summary & Save */}
                  {Object.values(quickQuantities).some(s => Object.values(s).some(v => v > 0)) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center justify-between p-3 bg-primary/5 rounded-xl"
                    >
                      <div className="text-sm">
                        <span className="font-medium">
                          {Object.values(quickQuantities).reduce(
                            (sum, s) => sum + Object.values(s).filter(v => v > 0).length, 0
                          )} giriş
                        </span>
                        <span className="text-muted-foreground ml-1">yapıldı</span>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={handleQuickSave}
                        disabled={createRecord.isPending}
                      >
                        {createRecord.isPending ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Kaydediliyor...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Kaydet
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Repeat Yesterday Dialog */}
      <Dialog open={repeatDialogOpen} onOpenChange={setRepeatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Dünkü Kayıtları Tekrarla
            </DialogTitle>
            <DialogDescription>
              Dünkü <strong>{yesterdayRecords?.length ?? 0}</strong> kayıt bugüne kopyalanacak.
              Müşteri, hizmet, miktar ve birim fiyat bilgileri aynen aktarılacaktır.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {yesterdayRecords?.map(record => (
              <div
                key={record.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{record.customer?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {record.service?.name} × {record.quantity}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                  ₺{record.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </Badge>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRepeatDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleRepeatYesterday}
              disabled={createRecord.isPending}
              className="gap-2"
            >
              {createRecord.isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Kopyalanıyor...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Kopyala
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (open) {
          setBatchEntries([{ serviceId: '', quantity: 1, unitPrice: 0 }])
          setBatchNotes('')
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Kayıt Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Müşteri *</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Batch Service Entries */}
            <div className="space-y-3">
              <Label>Hizmetler</Label>
              {batchEntries.map((entry, index) => (
                <div key={index} className="flex gap-2 items-start p-3 rounded-xl bg-muted/50">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={entry.serviceId}
                      onValueChange={(val) => updateBatchEntry(index, 'serviceId', val)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Hizmet seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.map(s => {
                          const price = getPriceForService(s.id, selectedCustomer)
                          return (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} - ₺{price.toFixed(2)}/{s.unit}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="1"
                          value={entry.quantity}
                          onChange={(e) => updateBatchEntry(index, 'quantity', e.target.value)}
                          placeholder="Adet"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.unitPrice}
                          onChange={(e) => updateBatchEntry(index, 'unitPrice', e.target.value)}
                          placeholder="Fiyat"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    {entry.serviceId && entry.quantity > 0 && (
                      <p className="text-xs font-medium text-primary">
                        Ara toplam: ₺{(entry.quantity * entry.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  {batchEntries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeBatchEntry(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1"
                onClick={addBatchEntry}
              >
                <PlusCircle className="w-3 h-3" />
                Başka Hizmet Ekle
              </Button>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Notlar
              </Label>
              <Textarea
                placeholder="İsteğe bağlı notlar..."
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                rows={2}
              />
            </div>

            {batchTotal > 0 && (
              <div className="flex items-center justify-between text-sm font-semibold p-3 bg-primary/5 rounded-xl">
                <span>Toplam:</span>
                <span className="text-primary">₺{batchTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleBatchSubmit}
              disabled={createRecord.isPending}
            >
              {createRecord.isPending ? 'Ekleniyor...' : 'Kaydet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 relative overflow-hidden">
        {/* Sparkline-like indicator bars */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-end gap-0.5 h-6 opacity-30">
          {[...Array(7)].map((_, i) => {
            const barHeight = Math.max(15, Math.min(100, 30 + Math.sin(i * 1.2) * 40 + Math.cos(i * 0.8) * 20))
            return (
              <div
                key={i}
                className="w-1 bg-primary rounded-full"
                style={{ height: `${barHeight}%` }}
              />
            )
          })}
        </div>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Günlük Toplam
            </p>
            <p className="text-xl font-bold text-primary">
              ₺{dayTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {displayedRecords?.length ?? 0} kayıt
          </Badge>
        </CardContent>
      </Card>

      {/* Records List - Grouped by Customer */}
      <div className="space-y-4">
        {recordsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : recordsByCustomer && Object.keys(recordsByCustomer).length > 0 ? (
          <AnimatePresence>
            {Object.entries(recordsByCustomer).map(([customerId, group]) => (
              <motion.Card
                key={customerId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="overflow-hidden"
              >
                <CardHeader className="py-3 px-4 bg-gradient-to-r from-muted/50 to-muted/30">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>{group.name}</span>
                    <span className="text-emerald-600 font-bold">
                      ₺{group.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {group.records.map((record) => (
                      <div key={record.id} className="flex items-center justify-between py-2.5 px-4 hover:bg-muted/30 transition-colors group">
                        {/* Drag handle visual indicator */}
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors shrink-0 mr-1 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm truncate">{record.service?.name}</p>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {record.service?.unit}
                            </Badge>
                          </div>
                          {editingId === record.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="number"
                                min="1"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                                className="h-7 w-20 text-sm"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleUpdateQuantity(record.id)}
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => {
                                setEditingId(record.id)
                                setEditQuantity(record.quantity)
                              }}
                            >
                              × {record.quantity} adet
                              <span className="ml-1 text-[10px] text-muted-foreground/60">(düzenle)</span>
                            </button>
                          )}
                          {record.notes && (
                            <p className="text-xs text-muted-foreground italic mt-0.5 flex items-center gap-1">
                              <StickyNote className="w-3 h-3" />
                              {record.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold whitespace-nowrap">
                              ₺{record.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              ₺{record.unitPrice.toFixed(2)}/ad
                            </p>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              onClick={() => handleDuplicateRecord(record)}
                              title="Kopyala"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Kaydı Sil</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {record.customer?.name} - {record.service?.name} × {record.quantity} kaydını silmek istediğinizden emin misiniz?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteRecord(record.id)}>
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </motion.Card>
            ))}
          </AnimatePresence>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Bu tarihte kayıt bulunamadı
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {formatDisplayDate(selectedDate)}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setDialogOpen(true)}
                >
                  <PlusCircle className="w-4 h-4" />
                  Kayıt Ekle
                </Button>
                {canRepeatYesterday && (
                  <Button
                    variant="outline"
                    className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950"
                    onClick={() => setRepeatDialogOpen(true)}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Dünü Tekrarla
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
