'use client'

import { useEffect, useState } from 'react'
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
  Building2,
  Landmark,
  CreditCard,
  MessageCircle,
  Eye,
  Table,
} from 'lucide-react'

interface CompanyInfo {
  name: string
  address: string
  phone: string
  taxNumber: string
}

interface AppPreferences {
  kdvRate: number
  invoiceDueDays: number
  currencySymbol: string
}

const defaultCompanyInfo: CompanyInfo = {
  name: 'Çamaşırhane',
  address: 'Atatürk Cad. No: 123, Kadıköy, İstanbul',
  phone: '+90 (216) 555 0100',
  taxNumber: '',
}

const defaultPreferences: AppPreferences = {
  kdvRate: 20,
  invoiceDueDays: 15,
  currencySymbol: '₺',
}

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}

/**
 * Clean, print-optimized invoice preview
 */
function InvoicePreviewContent({
  invoice,
  companyInfo,
  preferences,
}: {
  invoice: InvoiceData
  companyInfo: CompanyInfo
  preferences: AppPreferences
}) {
  const displayKdvRate = preferences.kdvRate
  const cs = preferences.currencySymbol
  const kdvAmount = invoice.subtotal * (displayKdvRate / 100)
  const grandTotal = invoice.subtotal + kdvAmount

  return (
    <div className="invoice-print bg-white text-gray-900 p-6 sm:p-8 font-sans">
      {/* Company Header - clean minimal */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyInfo.name}</h1>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mt-0.5">
              Yönetim Sistemi
            </p>
          </div>
          <div className="text-right text-xs text-gray-600 space-y-0.5">
            {companyInfo.address && <p>{companyInfo.address}</p>}
            {companyInfo.phone && <p>{companyInfo.phone}</p>}
            {companyInfo.taxNumber && (
              <p className="font-medium">Vergi No: {companyInfo.taxNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Title & Dates - clean */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">FATURA</h2>
          <p className="text-sm text-gray-600 font-mono mt-0.5">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-xs text-gray-600 space-y-1 text-right">
          <p>Fatura Tarihi: <strong>{formatDate(invoice.createdAt.split('T')[0])}</strong></p>
          <p>Vade Tarihi: <strong>{formatDate(invoice.dueDate)}</strong></p>
          <p>Dönem: <strong>{formatDate(invoice.startDate)} — {formatDate(invoice.endDate)}</strong></p>
        </div>
      </div>

      {/* Customer Info - clean box */}
      <div className="border border-gray-300 rounded p-3 mb-6">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Müşteri Bilgileri</h3>
        <p className="text-sm font-bold text-gray-900">{invoice.customer.name}</p>
        {invoice.customer.address && (
          <p className="text-xs text-gray-600">{invoice.customer.address}</p>
        )}
        {invoice.customer.phone && (
          <p className="text-xs text-gray-600">{invoice.customer.phone}</p>
        )}
      </div>

      {/* Service Table - clean borders */}
      <div className="mb-6">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-2 px-2 text-left font-semibold w-8">#</th>
              <th className="py-2 px-2 text-left font-semibold">Hizmet</th>
              <th className="py-2 px-2 text-center font-semibold w-14">Birim</th>
              <th className="py-2 px-2 text-center font-semibold w-14">Miktar</th>
              <th className="py-2 px-2 text-right font-semibold w-24">Birim Fiyat</th>
              <th className="py-2 px-2 text-right font-semibold w-24">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, idx) => (
              <tr key={item.serviceId} className="border-b border-gray-200">
                <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                <td className="py-2 px-2 font-medium text-gray-800">{item.serviceName}</td>
                <td className="py-2 px-2 text-center text-gray-500">{item.unit}</td>
                <td className="py-2 px-2 text-center text-gray-700">{item.quantity}</td>
                <td className="py-2 px-2 text-right text-gray-600">{formatCurrency(item.unitPrice, cs)}</td>
                <td className="py-2 px-2 text-right font-semibold text-gray-800">{formatCurrency(item.total, cs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals - clean right-aligned */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-1 text-xs text-gray-600">
            <span>Ara Toplam</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal, cs)}</span>
          </div>
          <div className="border-t border-gray-300 my-1" />
          <div className="flex justify-between py-1 text-xs text-gray-600">
            <span>KDV (%{displayKdvRate})</span>
            <span className="font-medium">{formatCurrency(kdvAmount, cs)}</span>
          </div>
          <div className="border-t-2 border-gray-800 my-1" />
          <div className="flex justify-between py-1.5 text-sm font-bold text-gray-900">
            <span>Genel Toplam</span>
            <span>{formatCurrency(grandTotal, cs)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info - minimal */}
      <div className="border border-gray-200 rounded p-3 mb-4">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Ödeme Bilgileri</h3>
        <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-600">
          <div>
            <span className="font-medium text-gray-700">Banka: </span>—
          </div>
          <div>
            <span className="font-medium text-gray-700">Hesap Adı: </span>{companyInfo.name}
          </div>
          <div>
            <span className="font-medium text-gray-700">IBAN: </span>—
          </div>
          <div>
            <span className="font-medium text-gray-700">Şube: </span>—
          </div>
        </div>
      </div>

      {/* Footer - minimal */}
      <div className="border-t border-gray-200 pt-3 text-[10px] text-gray-400 space-y-0.5">
        <p>Bu fatura {invoice.recordCount} adet kayıt esas alınarak oluşturulmuştur.</p>
        <p>Ödeme vade tarihine kadar yapılmalıdır. Gecikme durumunda yasal faiz uygulanır.</p>
        {companyInfo.taxNumber && (
          <p>Vergi No: {companyInfo.taxNumber}</p>
        )}
        <p className="mt-1 text-gray-300">Bu fatura bilgilendirme amaçlıdır. Resmi belge yerine geçmez.</p>
      </div>
    </div>
  )
}

/**
 * Rich, detailed invoice view with visual elements
 */
function InvoiceDataContent({
  invoice,
  companyInfo,
  preferences,
}: {
  invoice: InvoiceData
  companyInfo: CompanyInfo
  preferences: AppPreferences
}) {
  const displayKdvRate = preferences.kdvRate
  const cs = preferences.currencySymbol
  const kdvAmount = invoice.subtotal * (displayKdvRate / 100)
  const grandTotal = invoice.subtotal + kdvAmount

  return (
    <div className="invoice-print bg-white text-gray-900 p-6 sm:p-8 font-sans relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[8rem] font-black text-gray-100/60 -rotate-12 tracking-widest">
          FATURA
        </span>
      </div>

      {/* Company Header with gradient background */}
      <div className="relative bg-gradient-to-r from-teal-600 via-teal-600 to-teal-500 rounded-xl p-5 mb-6 text-white">
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shirt className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{companyInfo.name}</h1>
              <p className="text-xs font-medium uppercase tracking-wider text-teal-100">
                Yönetim Sistemi
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-teal-100 space-y-0.5">
            <p className="font-medium text-white flex items-center justify-end gap-1.5">
              <Building2 className="w-3 h-3" />
              {companyInfo.name}
            </p>
            {companyInfo.address && (
              <p className="flex items-center justify-end gap-1.5">
                <MapPin className="w-3 h-3 shrink-0" />
                {companyInfo.address}
              </p>
            )}
            {companyInfo.phone && (
              <p className="flex items-center justify-end gap-1.5">
                <Phone className="w-3 h-3 shrink-0" />
                {companyInfo.phone}
              </p>
            )}
            {companyInfo.taxNumber && (
              <p className="flex items-center justify-end gap-1.5 text-teal-50">
                <Landmark className="w-3 h-3 shrink-0" />
                Vergi No: {companyInfo.taxNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Title & Info */}
      <div className="flex items-start justify-between mb-6 relative z-10">
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 relative z-10">
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
      <div className="mb-6 overflow-hidden relative z-10">
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
                <td className="py-2.5 px-3 text-right text-gray-600">{cs}{formatCurrency(item.unitPrice, '')}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-gray-800">{cs}{formatCurrency(item.total, '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8 relative z-10">
        <div className="w-72 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between py-1.5 text-sm text-gray-600">
            <span>Ara Toplam</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal, cs)}</span>
          </div>
          <Separator className="my-1.5" />
          <div className="flex justify-between py-1.5 text-sm text-gray-600">
            <span>KDV (%{displayKdvRate})</span>
            <span className="font-medium">{formatCurrency(kdvAmount, cs)}</span>
          </div>
          <Separator className="my-1.5" />
          <div className="flex justify-between py-2.5 text-base bg-teal-600 -mx-1 -mb-1 px-4 rounded-b-lg text-white">
            <span className="font-bold">Genel Toplam</span>
            <span className="font-bold text-lg">{formatCurrency(grandTotal, cs)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 relative z-10">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          Ödeme Bilgileri
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <p className="font-medium text-gray-700">Banka</p>
            <p>—</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Hesap Adı</p>
            <p>{companyInfo.name}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">IBAN</p>
            <p>—</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Şube</p>
            <p>—</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Separator className="mb-4 relative z-10" />
      <div className="text-xs text-gray-400 space-y-1 relative z-10">
        <p className="font-medium text-gray-500">Notlar:</p>
        <p>Bu fatura {invoice.recordCount} adet kayıt esas alınarak oluşturulmuştur.</p>
        <p>Ödeme vade tarihine kadar yapılmalıdır. Gecikme durumunda yasal faiz uygulanır.</p>
        {companyInfo.taxNumber && (
          <p className="mt-1">Vergi No: {companyInfo.taxNumber}</p>
        )}
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



/**
 * Build a WhatsApp summary text for the invoice
 */
function buildWhatsAppMessage(
  invoice: InvoiceData,
  companyInfo: CompanyInfo,
  preferences: AppPreferences
): string {
  const cs = preferences.currencySymbol
  const displayKdvRate = preferences.kdvRate
  const kdvAmount = invoice.subtotal * (displayKdvRate / 100)
  const grandTotal = invoice.subtotal + kdvAmount

  const lines: string[] = []

  lines.push(`📋 *FATURA*`)
  lines.push(`📌 ${invoice.invoiceNumber}`)
  lines.push(`🏢 ${companyInfo.name}`)
  lines.push('')

  lines.push(`👤 *Müşteri:* ${invoice.customer.name}`)
  if (invoice.customer.phone) lines.push(`📞 ${invoice.customer.phone}`)
  lines.push('')

  lines.push(`📅 Dönem: ${formatDate(invoice.startDate)} — ${formatDate(invoice.endDate)}`)
  lines.push(`📅 Vade: ${formatDate(invoice.dueDate)}`)
  lines.push('')

  lines.push(`📦 *Hizmetler:*`)
  for (const item of invoice.lineItems) {
    lines.push(`  • ${item.serviceName}: ${item.quantity} ${item.unit} × ${formatCurrency(item.unitPrice, cs)} = ${formatCurrency(item.total, cs)}`)
  }
  lines.push('')

  lines.push(`💰 Ara Toplam: ${formatCurrency(invoice.subtotal, cs)}`)
  lines.push(`📊 KDV (%${displayKdvRate}): ${formatCurrency(kdvAmount, cs)}`)
  lines.push(`✅ *Genel Toplam: ${formatCurrency(grandTotal, cs)}*`)

  if (companyInfo.taxNumber) {
    lines.push('')
    lines.push(`🏦 Vergi No: ${companyInfo.taxNumber}`)
  }

  return lines.join('\n')
}

export function InvoiceDialog({
  open,
  onOpenChange,
  startDate,
  endDate,
  customerId,
}: InvoiceDialogProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'data'>('preview')
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo)
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences)

  // Fetch settings from Supabase when dialog opens
  useEffect(() => {
    if (!open) return
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setCompanyInfo({
            name: data.companyName || defaultCompanyInfo.name,
            address: data.companyAddress || defaultCompanyInfo.address,
            phone: data.companyPhone || defaultCompanyInfo.phone,
            taxNumber: data.companyTaxNumber || defaultCompanyInfo.taxNumber,
          })
          setPreferences({
            kdvRate: data.kdvRate ?? defaultPreferences.kdvRate,
            invoiceDueDays: data.invoiceDueDays ?? defaultPreferences.invoiceDueDays,
            currencySymbol: data.currencySymbol || defaultPreferences.currencySymbol,
          })
        }
      })
      .catch(() => {})
  }, [open])

  const { data: invoice, isLoading, error } = useInvoice(
    startDate,
    endDate,
    customerId,
    preferences.kdvRate,
    preferences.invoiceDueDays
  )

  const handlePrint = () => {
    const invoiceEl = document.querySelector('.invoice-print')
    if (!invoiceEl) return

    const printStyles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 24px; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
      th { font-weight: 600; border-bottom: 2px solid #111; }
      .text-right { text-align: right; } .text-center { text-align: center; }
      .font-bold { font-weight: 700; } .font-semibold { font-weight: 600; } .font-medium { font-weight: 500; }
      .text-xs { font-size: 11px; } .text-sm { font-size: 13px; } .text-base { font-size: 15px; }
      .text-lg { font-size: 17px; } .text-xl { font-size: 19px; } .text-2xl { font-size: 22px; }
      .text-gray-900 { color: #111; } .text-gray-800 { color: #1f2937; } .text-gray-700 { color: #374151; }
      .text-gray-600 { color: #4b5563; } .text-gray-500 { color: #6b7280; } .text-gray-400 { color: #9ca3af; }
      .border-b-2 { border-bottom: 2px solid; } .border-gray-800 { border-color: #1f2937; }
      .border-gray-300 { border-color: #d1d5db; } .border-gray-200 { border-color: #e5e7eb; }
      .border-t-2 { border-top: 2px solid; } .border-t { border-top: 1px solid; }
      .mb-6 { margin-bottom: 24px; } .mb-4 { margin-bottom: 16px; } .mb-2 { margin-bottom: 8px; } .mb-1 { margin-bottom: 4px; }
      .mt-1 { margin-top: 4px; } .mt-05 { margin-top: 2px; }
      .py-1 { padding-top: 4px; padding-bottom: 4px; } .py-2 { padding-top: 8px; padding-bottom: 8px; }
      .py-15 { padding-top: 6px; padding-bottom: 6px; } .px-2 { padding-left: 8px; padding-right: 8px; }
      .p-3 { padding: 12px; } .p-4 { padding: 16px; } .pb-4 { padding-bottom: 16px; }
      .flex { display: flex; } .justify-between { justify-content: space-between; } .justify-end { justify-content: flex-end; }
      .items-start { align-items: flex-start; } .gap-3 { gap: 12px; }
      .w-64 { width: 256px; } .w-8 { width: 32px; } .w-14 { width: 56px; } .w-24 { width: 96px; }
      .uppercase { text-transform: uppercase; } .tracking-wide { letter-spacing: 0.025em; } .tracking-wider { letter-spacing: 0.05em; }
      .grid { display: grid; } .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .border { border: 1px solid; } .rounded { border-radius: 4px; } .bg-white { background: #fff; }
      @page { size: A4; margin: 10mm; }
    `

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${printStyles}</style></head><body>${invoiceEl.innerHTML}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const newWindow = window.open(url, '_blank')

    // Fallback: if popup blocked, try iframe print
    if (!newWindow) {
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
      document.body.appendChild(iframe)
      const doc = iframe.contentDocument!
      doc.open()
      doc.write(html)
      doc.close()
      setTimeout(() => {
        try { iframe.contentWindow!.print() } catch {}
        document.body.removeChild(iframe)
      }, 500)
    }
  }

  const handleWhatsApp = () => {
    if (!invoice) return
    const message = buildWhatsAppMessage(invoice, companyInfo, preferences)
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Fatura
              </DialogTitle>
              <DialogDescription className="mt-1">
                {startDate && endDate && (
                  <span>{formatDate(startDate)} — {formatDate(endDate)} arası fatura</span>
                )}
              </DialogDescription>
            </div>
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Önizleme
              </button>
              <button
                type="button"
                onClick={() => setViewMode('data')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'data'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Ayrıntılı
              </button>
            </div>
          </div>
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
            viewMode === 'preview' ? (
              <InvoicePreviewContent
                invoice={invoice}
                companyInfo={companyInfo}
                preferences={preferences}
              />
            ) : (
              <InvoiceDataContent
                invoice={invoice}
                companyInfo={companyInfo}
                preferences={preferences}
              />
            )
          ) : null}
        </div>

        {/* Action Buttons - hidden during print */}
        <div className="p-4 border-t print-actions flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="print:hidden">
            Kapat
          </Button>
          {invoice && (
            <Button
              variant="outline"
              onClick={handleWhatsApp}
              className="gap-2 print:hidden text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp ile Gönder
            </Button>
          )}
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
