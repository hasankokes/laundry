'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  useCustomers, 
  useServices, 
  usePrices, 
  useRecords, 
  useCreateRecord, 
  useUpdateRecord, 
  useDeleteRecord 
} from '@/hooks/use-api'
import { 
  getDaysInMonth, 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  parseISO,
  isSameDay
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Save,
  CheckCircle2,
  Loader2,
  Calculator,
  LayoutGrid
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatrixEntryProps {
  initialCustomerId?: string
  initialMonth?: string // YYYY-MM
}

export function MatrixEntry({ initialCustomerId = '', initialMonth }: MatrixEntryProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId)
  
  // Current month in YYYY-MM format
  const currentMonthStr = initialMonth || format(new Date(), 'yyyy-MM')
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)

  const { data: customers, isLoading: customersLoading } = useCustomers()
  const { data: services, isLoading: servicesLoading } = useServices()
  const { data: prices } = usePrices(selectedCustomerId && selectedCustomerId !== 'all' ? selectedCustomerId : undefined)

  // Calculate month boundaries
  const monthDate = useMemo(() => parseISO(`${selectedMonth}-01`), [selectedMonth])
  const daysInMonth = useMemo(() => getDaysInMonth(monthDate), [monthDate])
  const startDate = useMemo(() => format(startOfMonth(monthDate), 'yyyy-MM-dd'), [monthDate])
  const endDate = useMemo(() => format(endOfMonth(monthDate), 'yyyy-MM-dd'), [monthDate])

  const { data: records, isLoading: recordsLoading } = useRecords({
    customerId: selectedCustomerId,
    startDate,
    endDate
  })

  const createRecord = useCreateRecord()
  const updateRecord = useUpdateRecord()
  const deleteRecord = useDeleteRecord()

  // Local grid state: Record<serviceId, Record<dayNum, { id?: string, quantity: number }>>
  const [gridData, setGridData] = useState<Record<string, Record<number, { id?: string, quantity: number }>>>({})
  const [isSyncing, setIsSyncing] = useState(false)

  // Populate grid from records
  useEffect(() => {
    if (!records || !services) return

    const newGrid: Record<string, Record<number, { id?: string, quantity: number }>> = {}
    
    // Initialize empty grid
    services.forEach(s => {
      newGrid[s.id] = {}
      for (let i = 1; i <= daysInMonth; i++) {
        newGrid[s.id][i] = { quantity: 0 }
      }
    })

    // Fill with records
    records.forEach(r => {
      const day = parseInt(r.date.split('-')[2])
      if (newGrid[r.serviceId]) {
        newGrid[r.serviceId][day] = { id: r.id, quantity: r.quantity }
      }
    })

    setGridData(newGrid)
  }, [records, services, daysInMonth])

  const handleCellChange = async (serviceId: string, day: number, value: string) => {
    const quantity = parseInt(value) || 0
    const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`
    const existingRecord = records?.find(r => r.serviceId === serviceId && r.date === dateStr)
    
    console.log(`[MatrixEntry] handleCellChange called! serviceId=${serviceId}, day=${day}, value="${value}", quantity=${quantity}`)
    console.log(`[MatrixEntry] dateStr=${dateStr}, existingRecord=`, existingRecord)
    
    // If the input is empty/0 and no record exists, do nothing
    if (!existingRecord && quantity === 0) {
      console.log(`[MatrixEntry] No existing record and quantity is 0. Returning.`)
      return
    }
    
    // If the quantity matches the DB record exactly, do nothing
    if (existingRecord?.quantity === quantity) {
      console.log(`[MatrixEntry] Quantity matches DB record. Returning.`)
      return
    }

    console.log(`[MatrixEntry] Proceeding to sync...`)
    setIsSyncing(true)
    try {
      if (existingRecord) {
        // Update or Delete
        if (quantity === 0) {
          console.log(`[MatrixEntry] Deleting record ${existingRecord.id}`)
          await deleteRecord.mutateAsync(existingRecord.id)
        } else {
          console.log(`[MatrixEntry] Updating record ${existingRecord.id} to ${quantity}`)
          await updateRecord.mutateAsync({ id: existingRecord.id, quantity })
        }
      } else if (quantity > 0) {
        // Create
        const unitPrice = prices?.find(p => p.serviceId === serviceId)?.price ?? 
                          services?.find(s => s.id === serviceId)?.defaultPrice ?? 0
        
        console.log(`[MatrixEntry] Creating new record. Date=${dateStr}, qty=${quantity}, unitPrice=${unitPrice}`)
        await createRecord.mutateAsync({
          customerId: selectedCustomerId,
          serviceId,
          date: dateStr,
          quantity,
          unitPrice
        })
      }
    } catch (error) {
      toast.error('Kayıt güncellenemedi')
      console.error('[MatrixEntry] Error syncing:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSaveAll = () => {
    // Force blur any active element to trigger onBlur save
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    toast.success('Tüm değişiklikler kaydedildi')
  }

  const navigateMonth = (direction: number) => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const date = new Date(y, m - 1 + direction, 1)
    setSelectedMonth(format(date, 'yyyy-MM'))
  }

  const sortedServices = useMemo(() => {
    if (!services) return []
    return [...services].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  }, [services])

  const dayColumns = useMemo(() => {
    const columns = []
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), i)
      columns.push({
        day: i,
        name: format(date, 'eee', { locale: tr }).slice(0, 1),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    return columns
  }, [daysInMonth, monthDate])

  // Totals
  const serviceTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    Object.entries(gridData).forEach(([svcId, days]) => {
      totals[svcId] = Object.values(days).reduce((sum, d) => sum + d.quantity, 0)
    })
    return totals
  }, [gridData])

  const dayTotals = useMemo(() => {
    const totals: Record<number, number> = {}
    for (let i = 1; i <= daysInMonth; i++) {
      let sum = 0
      Object.values(gridData).forEach(days => {
        sum += days[i]?.quantity ?? 0
      })
      totals[i] = sum
    }
    return totals
  }, [gridData, daysInMonth])

  if (customersLoading || servicesLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/20 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-64">
                <Label className="text-xs mb-1 block">Müşteri Seçin</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 md:w-48">
                <Label className="text-xs mb-1 block">Ay Seçin</Label>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => navigateMonth(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="h-10 text-center text-sm"
                  />
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => navigateMonth(1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              {isSyncing ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Kaydediliyor...
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Değişiklikler Kaydedildi
                </div>
              )}
              
              <Button 
                onClick={handleSaveAll}
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-10 px-4 shadow-sm"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-end pt-2 border-t md:border-0 md:pt-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ay Toplamı</p>
                <p className="text-lg font-bold text-primary">
                  {Object.values(serviceTotals).reduce((a, b) => a + b, 0).toLocaleString('tr-TR')}
                </p>
              </div>

          {!selectedCustomerId ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
              <LayoutGrid className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm font-medium">Lütfen bir müşteri seçin</p>
            </div>
          ) : recordsLoading ? (
             <div className="h-64 flex items-center justify-center">
               <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
             </div>
          ) : (
            <div className="relative overflow-x-auto rounded-xl border shadow-inner bg-card/50">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-30 bg-background/95 border-r p-2 text-left min-w-[140px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Hizmet Adı
                    </th>
                    <th className="p-2 border-r text-center min-w-[60px] text-muted-foreground">Fiyat</th>
                    {dayColumns.map(col => (
                      <th 
                        key={col.day} 
                        className={cn(
                          "p-1 border-r text-center min-w-[32px] transition-colors",
                          col.isWeekend && "bg-muted/50"
                        )}
                      >
                        <div className="text-[9px] font-normal opacity-70 uppercase">{col.name}</div>
                        <div className="font-bold">{col.day}</div>
                      </th>
                    ))}
                    <th className="p-2 text-center min-w-[60px] bg-primary/5 font-bold text-primary">Toplam</th>
                  </tr>
                </thead>
                <TableBody>
                  {sortedServices.map(service => {
                    const price = prices?.find(p => p.serviceId === service.id)?.price ?? service.defaultPrice
                    return (
                      <tr key={service.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="sticky left-0 z-10 bg-background group-hover:bg-muted/50 border-r p-2 font-medium shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {service.name}
                        </td>
                        <td className="p-2 border-r text-center text-muted-foreground">
                          ₺{price.toFixed(1)}
                        </td>
                        {dayColumns.map(col => (
                          <td 
                            key={col.day} 
                            className={cn(
                              "p-0 border-r text-center",
                              col.isWeekend && "bg-muted/20"
                            )}
                          >
                            <input
                              type="number"
                              min="0"
                              value={gridData[service.id]?.[col.day]?.quantity || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                // Update local only
                                setGridData(prev => ({
                                  ...prev,
                                  [service.id]: {
                                    ...prev[service.id],
                                    [col.day]: { ...prev[service.id][col.day], quantity: parseInt(val) || 0 }
                                  }
                                }))
                              }}
                              onBlur={(e) => handleCellChange(service.id, col.day, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur()
                                }
                              }}
                              className={cn(
                                "w-full h-9 text-center bg-transparent focus:bg-primary/10 focus:outline-none transition-all tabular-nums",
                                "[appearance:none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                                (gridData[service.id]?.[col.day]?.quantity ?? 0) > 0 ? "font-bold text-foreground" : "text-transparent hover:text-muted-foreground/50"
                              )}
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-primary/5 text-primary">
                          {serviceTotals[service.id] || 0}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Footer Totals Row */}
                  <tr className="bg-muted/30 font-bold border-t-2">
                    <td className="sticky left-0 z-10 bg-muted border-r p-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Günlük Toplam
                    </td>
                    <td className="border-r"></td>
                    {dayColumns.map(col => (
                      <td key={col.day} className="p-2 text-center border-r text-[10px]">
                        {dayTotals[col.day] || ''}
                      </td>
                    ))}
                    <td className="p-2 text-center bg-primary text-primary-foreground">
                      {Object.values(serviceTotals).reduce((a, b) => a + b, 0)}
                    </td>
                  </tr>
                </TableBody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
        <LayoutGrid className="w-3.5 h-3.5" />
        <p>Hücrelere sayı girip <b>Enter</b>'a basarak veya başka hücreye geçerek kaydedebilirsiniz. Sıfır (0) girilirse kayıt silinir.</p>
      </div>
    </div>
  )
}
