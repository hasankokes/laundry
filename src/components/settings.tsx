'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import {
  Building2,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  Sliders,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Save,
  Check,
  Clock,
  Loader2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function Settings() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo)
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [companySaved, setCompanySaved] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  // Load from Supabase on mount
  useEffect(() => {
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
      .finally(() => setIsLoadingSettings(false))

    const savedBackup = localStorage.getItem('last-backup-date')
    if (savedBackup) setLastBackup(savedBackup)
  }, [])

  const saveCompanyInfo = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyInfo.name,
          companyAddress: companyInfo.address,
          companyPhone: companyInfo.phone,
          companyTaxNumber: companyInfo.taxNumber,
        }),
      })
      if (!res.ok) throw new Error()
      setCompanySaved(true)
      toast.success('Firma bilgileri kaydedildi')
      setTimeout(() => setCompanySaved(false), 2000)
    } catch {
      toast.error('Firma bilgileri kaydedilirken hata oluştu')
    }
  }

  const savePreferences = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kdvRate: preferences.kdvRate,
          invoiceDueDays: preferences.invoiceDueDays,
          currencySymbol: preferences.currencySymbol,
        }),
      })
      if (!res.ok) throw new Error()
      setPrefsSaved(true)
      toast.success('Uygulama tercihleri kaydedildi')
      setTimeout(() => setPrefsSaved(false), 2000)
    } catch {
      toast.error('Tercihler kaydedilirken hata oluştu')
    }
  }

  const handleExportAll = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/data/export')
      if (!res.ok) throw new Error('Dışa aktarma başarısız')

      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `camasirhane-yedek-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const now = new Date().toLocaleString('tr-TR')
      localStorage.setItem('last-backup-date', now)
      setLastBackup(now)

      toast.success('Veriler başarıyla dışa aktarıldı')
    } catch {
      toast.error('Dışa aktarma sırasında hata oluştu')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const res = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('İçe aktarma başarısız')

      const result = await res.json()
      toast.success(
        `İçe aktarma başarılı: ${result.imported.customers} müşteri, ${result.imported.services} hizmet, ${result.imported.customerPrices} fiyat, ${result.imported.dailyRecords} kayıt`
      )

      // Refresh all queries
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['records'] })
      queryClient.invalidateQueries({ queryKey: ['prices'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    } catch {
      toast.error('İçe aktarma sırasında hata oluştu. Dosya formatını kontrol edin.')
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExportCsv = async () => {
    setIsExportingCsv(true)
    try {
      const res = await fetch('/api/data/export')
      if (!res.ok) throw new Error('Dışa aktarma başarısız')

      const data = await res.json()
      const records = data.dailyRecords || []

      if (records.length === 0) {
        toast.error('Dışa aktarılacak kayıt bulunamadı')
        return
      }

      // Build customer and service lookup maps
      const customerMap = new Map((data.customers || []).map((c: { id: string; name: string }) => [c.id, c.name]))
      const serviceMap = new Map((data.services || []).map((s: { id: string; name: string; unit: string }) => [s.id, { name: s.name, unit: s.unit }]))

      // Create CSV content with BOM for Turkish characters
      const bom = '\uFEFF'
      const headers = ['Tarih', 'Müşteri', 'Hizmet', 'Birim', 'Miktar', 'Birim Fiyat', 'Toplam', 'Notlar']
      const rows = records.map((r: {
        date: string
        customerId: string
        serviceId: string
        quantity: number
        unitPrice: number
        total: number
        notes: string | null
      }) => {
        const customerName = customerMap.get(r.customerId) || 'Bilinmeyen'
        const service = serviceMap.get(r.serviceId) || { name: 'Bilinmeyen', unit: '' }
        return [
          r.date,
          customerName,
          service.name,
          service.unit,
          r.quantity,
          r.unitPrice.toLocaleString('tr-TR'),
          r.total.toLocaleString('tr-TR'),
          r.notes || '',
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      })

      const csvContent = bom + [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `camasirhane-kayitlar-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('CSV dosyası başarıyla dışa aktarıldı')
    } catch {
      toast.error('CSV dışa aktarma sırasında hata oluştu')
    } finally {
      setIsExportingCsv(false)
    }
  }

  const handleClearRecords = async () => {
    setIsClearing(true)
    try {
      const res = await fetch('/api/data/clear', { method: 'DELETE' })
      if (!res.ok) throw new Error('Kayıtlar silinemedi')

      const result = await res.json()
      toast.success(`${result.deletedCount} kayıt silindi`)

      queryClient.invalidateQueries({ queryKey: ['records'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    } catch {
      toast.error('Kayıtlar silinirken hata oluştu')
    } finally {
      setIsClearing(false)
    }
  }

  const handleResetAll = async () => {
    if (resetConfirmText !== 'SİL') return
    setIsResetting(true)
    try {
      const res = await fetch('/api/data/reset', { method: 'DELETE' })
      if (!res.ok) throw new Error('Hata')

      const result = await res.json()
      toast.success(
        `Tüm veriler sıfırlandı: ${result.deleted.customers} müşteri, ${result.deleted.services} hizmet, ${result.deleted.prices} fiyat, ${result.deleted.records} kayıt silindi`
      )

      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['records'] })
      queryClient.invalidateQueries({ queryKey: ['prices'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    } catch {
      toast.error('Veriler sıfırlanırken hata oluştu')
    } finally {
      setIsResetting(false)
      setResetConfirmText('')
    }
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold tracking-tight">Ayarlar</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Uygulama ayarlarını ve veri yönetimini buradan yapabilirsiniz
        </p>
      </motion.div>

      {/* Company Info Section */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Firma Bilgileri</CardTitle>
                <CardDescription>Fatura ve belgelerde görünecek şirket bilgileri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Firma Adı</Label>
                <Input
                  id="company-name"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  placeholder="Firma adı"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Telefon</Label>
                <Input
                  id="company-phone"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                  placeholder="+90 (216) 555 0100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Adres</Label>
              <Input
                id="company-address"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                placeholder="Firma adresi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-tax">Vergi Numarası</Label>
              <Input
                id="company-tax"
                value={companyInfo.taxNumber}
                onChange={(e) => setCompanyInfo({ ...companyInfo, taxNumber: e.target.value })}
                placeholder="Vergi numarası (opsiyonel)"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={saveCompanyInfo} className="gap-2">
                {companySaved ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-4 h-4 text-emerald-500" />
                  </motion.div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {companySaved ? 'Kaydedildi' : 'Kaydet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gradient Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Data Management Section */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Veri Yönetimi</CardTitle>
                <CardDescription>Verilerinizi dışa aktarın, içe aktarın veya yedekleyin</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastBackup && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Son yedekleme: {lastBackup}</span>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={handleExportAll}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                )}
                <span className="text-sm font-medium">Tüm Veriyi Dışa Aktar</span>
                <span className="text-xs text-muted-foreground">JSON formatında</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
                <span className="text-sm font-medium">Veri İçe Aktar</span>
                <span className="text-xs text-muted-foreground">JSON dosyası seçin</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={handleExportCsv}
                disabled={isExportingCsv}
              >
                {isExportingCsv ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="text-sm font-medium">CSV Olarak Dışa Aktar</span>
                <span className="text-xs text-muted-foreground">Kayıtlar</span>
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />

            <Separator />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>Dışa aktarma</strong>: Tüm müşteri, hizmet, fiyat ve kayıt verilerinizi JSON dosyası olarak indirir</p>
              <p>• <strong>İçe aktarma</strong>: Daha önce dışa aktardığınız JSON dosyasını yükleyerek verilerinizi geri yükler</p>
              <p>• <strong>CSV</strong>: Günlük kayıtlarınızı Excel ile açılabilir CSV formatında indirir</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gradient Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* App Preferences Section */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Uygulama Tercihleri</CardTitle>
                <CardDescription>Fatura ve hesaplama varsayılanları</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="kdv-rate">Varsayılan KDV Oranı (%)</Label>
                <Input
                  id="kdv-rate"
                  type="number"
                  min="0"
                  max="100"
                  value={preferences.kdvRate}
                  onChange={(e) => setPreferences({ ...preferences, kdvRate: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-due">Fatura Vade Süresi (Gün)</Label>
                <Input
                  id="invoice-due"
                  type="number"
                  min="1"
                  max="90"
                  value={preferences.invoiceDueDays}
                  onChange={(e) => setPreferences({ ...preferences, invoiceDueDays: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Para Birimi Sembolü</Label>
                <Input
                  id="currency"
                  value={preferences.currencySymbol}
                  onChange={(e) => setPreferences({ ...preferences, currencySymbol: e.target.value })}
                  maxLength={3}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={savePreferences} variant="outline" className="gap-2">
                {prefsSaved ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-4 h-4 text-emerald-500" />
                  </motion.div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {prefsSaved ? 'Kaydedildi' : 'Kaydet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gradient Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Danger Zone Section */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="border-destructive/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-destructive">Tehlikeli Bölge</CardTitle>
                <CardDescription>Bu işlemler geri alınamaz. Lütfen dikkatli olun.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clear All Records - Double confirmation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Tüm Kayıtları Sil</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Müşteri ve hizmet verileri korunarak tüm günlük kayıtlar silinir
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="shrink-0 gap-2" disabled={isClearing}>
                    {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Kayıtları Sil
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu işlem tüm günlük kayıtları kalıcı olarak silecek. Müşteri ve hizmet verileri korunacaktır. Bu işlem geri alınamaz.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearRecords}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Evet, Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Reset All Data - Triple confirmation (type SİL) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Tüm Verileri Sıfırla</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tüm kayıtlar, müşteriler, hizmetler ve fiyatlar silinir. Uygulama ilk kurulum durumuna döner
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="shrink-0 gap-2" disabled={isResetting}>
                    {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Sıfırla
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">⚠️ Kritik Uyarı</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>
                          Bu işlem <strong>tüm verilerinizi kalıcı olarak silecek</strong>. Müşteriler, hizmetler, fiyatlar ve kayıtlar dahil olmak üzere her şey silinecek.
                        </p>
                        <p className="font-semibold text-foreground">
                          Devam etmek için aşağıya &quot;SİL&quot; yazın:
                        </p>
                        <Input
                          value={resetConfirmText}
                          onChange={(e) => setResetConfirmText(e.target.value)}
                          placeholder='Onaylamak için "SİL" yazın'
                          className="mt-2"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setResetConfirmText('')}>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetAll}
                      disabled={resetConfirmText !== 'SİL'}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                    >
                      Tüm Verileri Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="text-xs text-destructive/70 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              <span>Bu işlemler geri alınamaz. Öncesinde verilerinizi dışa aktarmayı unutmayın.</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Version Number */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground/50 font-medium">Çamaşırhane Yönetim Sistemi v1.0.0</p>
      </div>
    </div>
  )
}
