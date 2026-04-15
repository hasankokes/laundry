'use client'

import { useState } from 'react'
import { useCustomers, useCreatePayment } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign, Calendar, CreditCard, FileText } from 'lucide-react'
import { toast } from 'sonner'

const paymentMethods = [
  { value: 'nakit', label: 'Nakit' },
  { value: 'havale', label: 'Havale/EFT' },
  { value: 'kredi_karti', label: 'Kredi Kartı' },
  { value: 'pesin', label: 'Peşin' },
]

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId?: string
}

export function PaymentDialog({ open, onOpenChange, customerId: preselectedCustomerId }: PaymentDialogProps) {
  const today = new Date().toISOString().split('T')[0]
  const [selectedCustomer, setSelectedCustomer] = useState<string>(preselectedCustomerId || '')
  const [amount, setAmount] = useState<string>('')
  const [date, setDate] = useState<string>(today)
  const [method, setMethod] = useState<string>('nakit')
  const [description, setDescription] = useState<string>('')

  const { data: customers } = useCustomers()
  const createPayment = useCreatePayment()

  // Pre-select customer when prop changes - use initial value pattern
  const initialCustomerId = preselectedCustomerId || ''
  const effectiveCustomer = selectedCustomer || initialCustomerId

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error('Lütfen müşteri seçin')
      return
    }
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Geçerli bir tutar girin')
      return
    }
    if (!date) {
      toast.error('Tarih seçin')
      return
    }

    try {
      await createPayment.mutateAsync({
        customerId: selectedCustomer,
        amount: amountNum,
        date,
        method,
        description: description?.trim() || undefined,
      })
      toast.success('Ödeme eklendi')
      onOpenChange(false)
    } catch {
      toast.error('Ödeme eklenirken hata oluştu')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Yeni Ödeme Ekle
          </DialogTitle>
          <DialogDescription>
            Müşteri ödeme kaydı oluşturun
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Müşteri *</Label>
            <Select value={effectiveCustomer} onValueChange={setSelectedCustomer}>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Tutar (₺) *
              </Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Tarih *
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Ödeme Yöntemi
            </Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Açıklama
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İsteğe bağlı açıklama..."
              rows={2}
            />
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
              <span className="text-sm font-medium">Ödenecek Tutar:</span>
              <span className="text-lg font-bold text-emerald-600">
                ₺{parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={createPayment.isPending}
          >
            {createPayment.isPending ? 'Ekleniyor...' : 'Ödeme Kaydet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
