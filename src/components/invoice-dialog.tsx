'use client'

import { useInvoice, InvoiceData } from '@/hooks/use-api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Printer,
  Shirt,
  MapPin,
  Phone,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react'

function formatCurrency(amount: number): string {
  return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}

function InvoiceContent({ invoice }: { invoice: InvoiceData }) {
  return (
    <div className="invoice-print bg-white text-gray-900 p-6 sm:p-8 font-sans">
      {/* Company Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
            <Shirt className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-teal-700">Çamaşırhane</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Yönetim Sistemi</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-0.5">
          <p className="font-medium text-gray-700">Çamaşırhane Yönetim Sistemi</p>
          <p>Atatürk Cad. No: 123</p>
          <p>Kadıköy, İstanbul 34710</p>
          <p className="flex items-center justify-end gap-1">
            <Phone className="w-3 h-3" />
            +90 (216) 555 0100
          </p>
        </div>
      </div>

      <Separator className="bg-teal-600 h-0.5 mb-6" />

      {/* Invoice Title & Info */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">FATURA</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4 text-teal-600" />
            <span className="font-mono font-semibold text-teal-700">{invoice.invoiceNumber}</span>
          </div>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Fatura Tarihi: <strong>{formatDate(invoice.createdAt.split('T')[0])}</strong></span>
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Vade Tarihi: <strong>{formatDate(invoice.dueDate)}</strong></span>
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Dönem: <strong>{formatDate(invoice.startDate)} — {formatDate(invoice.endDate)}</strong></span>
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Müşteri Bilgileri</h3>
        <p className="text-base font-bold text-gray-800">{invoice.customer.name}</p>
        {invoice.customer.address && (
          <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {invoice.customer.address}
          </p>
        )}
        {invoice.customer.phone && (
          <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {invoice.customer.phone}
          </p>
        )}
      </div>

      {/* Service Table */}
      <div className="mb-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-600 text-white">
              <th className="py-2.5 px-3 text-left font-semibold w-10">#</th>
              <th className="py-2.5 px-3 text-left font-semibold">Hizmet</th>
              <th className="py-2.5 px-3 text-center font-semibold w-16">Birim</th>
              <th className="py-2.5 px-3 text-center font-semibold w-16">Miktar</th>
              <th className="py-2.5 px-3 text-right font-semibold w-28">Birim Fiyat</th>
              <th className="py-2.5 px-3 text-right font-semibold w-28">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, idx) => (
              <tr
                key={item.serviceId}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="py-2.5 px-3 text-gray-500">{idx + 1}</td>
                <td className="py-2.5 px-3 font-medium text-gray-800">{item.serviceName}</td>
                <td className="py-2.5 px-3 text-center text-gray-500">{item.unit}</td>
                <td className="py-2.5 px-3 text-center text-gray-700 font-medium">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right text-gray-600">₺{formatCurrency(item.unitPrice)}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-gray-800">₺{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-72">
          <div className="flex justify-between py-2 text-sm text-gray-600">
            <span>Ara Toplam</span>
            <span className="font-medium">₺{formatCurrency(invoice.subtotal)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between py-2 text-sm text-gray-600">
            <span>KDV (%{(invoice.kdvRate * 100).toFixed(0)})</span>
            <span className="font-medium">₺{formatCurrency(invoice.kdvAmount)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between py-3 text-base bg-teal-50 -mx-3 px-3 rounded-lg">
            <span className="font-bold text-teal-800">Genel Toplam</span>
            <span className="font-bold text-teal-700 text-lg">₺{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Separator className="mb-4" />
      <div className="text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-500">Notlar:</p>
        <p>Bu fata {invoice.recordCount} adet kayıt esas alınarak oluşturulmuştur.</p>
        <p>Ödeme vade tarihine kadar yapılmalıdır. Gecikme durumunda yasal faiz uygulanır.</p>
        <p className="mt-2 text-gray-400">Bu fatura bilgilendirme amaçlıdır. Resmi belge yerine geçmez.</p>
      </div>
    </div>
  )
}

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  startDate: string
  endDate: string
  customerId: string
}

export function InvoiceDialog({
  open,
  onOpenChange,
  startDate,
  endDate,
  customerId,
}: InvoiceDialogProps) {
  const { data: invoice, isLoading, error } = useInvoice(
    startDate,
    endDate,
    customerId
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Fatura Önizleme
          </DialogTitle>
          <DialogDescription>
            {startDate && endDate && (
              <span>{formatDate(startDate)} — {formatDate(endDate)} arası fatura</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2">
          {isLoading ? (
            <div className="space-y-4 p-4">
              <div className="flex justify-between">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-48" />
              </div>
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-72 ml-auto" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-destructive/40 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                Fatura oluşturulamadı
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {error.message || 'Bu müşteri ve tarih aralığı için kayıt bulunamadı.'}
              </p>
            </div>
          ) : invoice ? (
            <InvoiceContent invoice={invoice} />
          ) : null}
        </div>

        {/* Print Button - hidden during print */}
        <div className="p-4 border-t print-actions flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="print:hidden">
            Kapat
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!invoice}
            className="gap-2 print:hidden"
          >
            <Printer className="w-4 h-4" />
            Yazdır
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
