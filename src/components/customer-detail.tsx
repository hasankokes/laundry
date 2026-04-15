'use client'

import { useCustomerHistory, useUpdateCustomer, useServices, usePrices, useSetPrice, useCustomerBalance, useDeletePayment } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Phone,
  MapPin,
  TrendingUp,
  FileText,
  Shirt,
  Pencil,
  DollarSign,
  Calendar,
  StickyNote,
  CreditCard,
  Trash2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useState } from 'react'
import { toast } from 'sonner'
import { PaymentDialog } from './payment-dialog'
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

const monthNames = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
]

const SERVICE_COLORS = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-orange-500',
  'bg-pink-500',
]

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: 'easeOut' },
  }),
}

// Custom tooltip for bar chart
function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-emerald-600">
          ₺{payload[0].value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    )
  }
  return null
}

interface CustomerDetailProps {
  customerId: string
  onBack: () => void
  onEditCustomer: (id: string) => void
  onSetPrices: (id: string) => void
}

export function CustomerDetail({ customerId, onBack, onEditCustomer, onSetPrices }: CustomerDetailProps) {
  const { data, isLoading } = useCustomerHistory(customerId)
  const { data: balanceData } = useCustomerBalance(customerId)
  const deletePayment = useDeletePayment()
  const [editOpen, setEditOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const handleEditClick = () => {
    onEditCustomer(customerId)
  }

  const handleSetPricesClick = () => {
    onSetPrices(customerId)
  }

  const handleDeletePayment = async (id: string) => {
    try {
      await deletePayment.mutateAsync(id)
      toast.success('Ödeme silindi')
    } catch {
      toast.error('Ödeme silinirken hata oluştu')
    }
  }

  const methodLabels: Record<string, string> = {
    nakit: 'Nakit',
    havale: 'Havale/EFT',
    kredi_karti: 'Kredi Kartı',
    pesin: 'Peşin',
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Müşteri bulunamadı</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>
      </div>
    )
  }

  const { customer, totalBalance, recordCount, activeServicesCount, serviceBreakdown, monthlySummary, recentRecords, customPrices } = data

  // Max revenue for progress bars
  const maxServiceRevenue = serviceBreakdown.length > 0
    ? Math.max(...serviceBreakdown.map(s => s.totalRevenue))
    : 0

  // Monthly chart data - last 6 months, sorted ascending
  const chartData = [...monthlySummary]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map(m => ({
      name: monthNames[parseInt(m.month.split('-')[1]) - 1],
      ciro: m.totalRevenue,
      ay: m.month,
    }))

  // Format date for display
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-')
    return `${parts[2]}.${parts[1]}.${parts[0]}`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 hover:bg-primary/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{customer.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.phone}
                </span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5" />
                  {customer.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {customer.notes && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
            <StickyNote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">{customer.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleEditClick}>
            <Pencil className="w-3.5 h-3.5" />
            Düzenle
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSetPricesClick}>
            <DollarSign className="w-3.5 h-3.5" />
            Fiyatlar
          </Button>
          {customPrices.length > 0 && (
            <Badge variant="secondary" className="ml-auto self-center">
              {customPrices.length} özel fiyat
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Balance Section */}
      {balanceData && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 text-white">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-white/70 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[10px] font-medium">Toplam Borç</span>
                </div>
                <p className="text-base font-bold">
                  ₺{balanceData.totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-white/70 mb-1">
                  <Wallet className="w-3 h-3" />
                  <span className="text-[10px] font-medium">Toplam Ödeme</span>
                </div>
                <p className="text-base font-bold">
                  ₺{balanceData.totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card className={balanceData.balance > 0
              ? "bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white"
              : balanceData.balance < 0
                ? "bg-gradient-to-br from-emerald-500 to-teal-500 border-0 text-white"
                : "bg-gradient-to-br from-gray-500 to-gray-600 border-0 text-white"
            }>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-white/70 mb-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="text-[10px] font-medium">Bakiye</span>
                </div>
                <p className="text-base font-bold">
                  ₺{Math.abs(balanceData.balance).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-white/70 mt-0.5">
                  {balanceData.balance > 0 ? 'Borçlu' : balanceData.balance < 0 ? 'Alacaklı' : 'Borç Yok'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Add Payment Button */}
          <Button
            variant="outline"
            className="w-full gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950"
            onClick={() => setPaymentDialogOpen(true)}
          >
            <PlusCircle className="w-4 h-4" />
            Ödeme Ekle
          </Button>

          {/* Payment History */}
          {balanceData.recentPayments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Ödeme Geçmişi
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {balanceData.recentPayments.length} ödeme
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {balanceData.recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            ₺{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(payment.date)}</span>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {methodLabels[payment.method] || payment.method}
                            </Badge>
                          </div>
                          {payment.description && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">{payment.description}</p>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ödemeyi Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              ₺{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} tutarındaki ödemeyi silmek istediğinizden emin misiniz?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePayment(payment.id)}>Sil</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <PaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            customerId={customerId}
          />
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                </div>
                <span className="text-[10px] font-medium">Toplam Bakiye</span>
              </div>
              <p className="text-lg font-bold text-emerald-600">
                ₺{totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <div className="w-5 h-5 rounded-md bg-teal-500/10 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-teal-500" />
                </div>
                <span className="text-[10px] font-medium">Toplam Kayıt</span>
              </div>
              <p className="text-lg font-bold text-teal-600">
                {recordCount.toLocaleString('tr-TR')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <Shirt className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-[10px] font-medium">Hizmet Çeşidi</span>
              </div>
              <p className="text-lg font-bold text-amber-600">
                {activeServicesCount}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Service Breakdown */}
      {serviceBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shirt className="w-4 h-4 text-primary" />
                Hizmet Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {serviceBreakdown.map((service, index) => {
                const percentage = maxServiceRevenue > 0
                  ? (service.totalRevenue / maxServiceRevenue) * 100
                  : 0
                const revenuePercentage = totalBalance > 0
                  ? ((service.totalRevenue / totalBalance) * 100).toFixed(1)
                  : '0.0'

                return (
                  <motion.div
                    key={service.serviceId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.04 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${SERVICE_COLORS[index % SERVICE_COLORS.length]}`} />
                        <span className="text-sm font-medium truncate">{service.serviceName}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {service.totalQuantity.toLocaleString('tr-TR')} {service.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">%{revenuePercentage}</span>
                        <span className="text-sm font-semibold text-emerald-600">
                          ₺{service.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Monthly Revenue Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Aylık Ciro
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
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
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Custom Prices */}
      {customPrices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Özel Fiyatlar
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {customPrices.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {customPrices.map((cp) => {
                  const diff = cp.customPrice - cp.defaultPrice
                  const isHigher = diff > 0
                  const isLower = diff < 0

                  return (
                    <div key={cp.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{cp.serviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          Varsayılan: ₺{cp.defaultPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}/{cp.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          ₺{cp.customPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                        <Badge
                          className={`text-[10px] ${
                            isHigher ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                            isLower ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isHigher ? '↑' : isLower ? '↓' : '='}
                          {diff !== 0 && `₺${Math.abs(diff).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Son Kayıtlar
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {recordCount > 20 ? `20 / ${recordCount}` : recordCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentRecords.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Henüz kayıt bulunmuyor</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bu müşteriye ait henüz işlem kaydı yok
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Tarih</TableHead>
                      <TableHead className="text-xs">Hizmet</TableHead>
                      <TableHead className="text-xs text-right">Miktar</TableHead>
                      <TableHead className="text-xs text-right">Birim</TableHead>
                      <TableHead className="text-xs text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-xs font-medium">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {record.serviceName}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {record.quantity.toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          ₺{record.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold text-emerald-600">
                          ₺{record.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
