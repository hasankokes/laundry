'use client'

import { useState } from 'react'
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useServices,
  usePrices,
  useSetPrice,
} from '@/hooks/use-api'
import { CustomerDetail } from '@/components/customer-detail'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  PlusCircle,
  Trash2,
  Pencil,
  Users,
  Phone,
  MapPin,
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Hash-based color generator for initials avatars
function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    'bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
    'bg-violet-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500',
    'bg-indigo-500', 'bg-lime-500',
  ]
  return colors[Math.abs(hash) % colors.length]
}

export function Customers() {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)

  const { data: customers, isLoading } = useCustomers()
  const { data: services } = useServices()
  const { data: prices } = usePrices(selectedCustomer)
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const setPrice = useSetPrice()

  const filteredCustomers = searchQuery
    ? customers?.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
      )
    : customers

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const notes = formData.get('notes') as string

    if (!name?.trim()) {
      toast.error('Müşteri adı gereklidir')
      return
    }

    try {
      await createCustomer.mutateAsync({
        name: name.trim(),
        phone: phone?.trim() || undefined,
        address: address?.trim() || undefined,
        notes: notes?.trim() || undefined,
      })
      toast.success('Müşteri eklendi')
      setAddOpen(false)
    } catch {
      toast.error('Müşteri eklenirken hata oluştu')
    }
  }

  const handleEditCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const notes = formData.get('notes') as string

    try {
      await updateCustomer.mutateAsync({
        id: selectedCustomer,
        name: name.trim(),
        phone: phone?.trim() || undefined,
        address: address?.trim() || undefined,
        notes: notes?.trim() || undefined,
      })
      toast.success('Müşteri güncellendi')
      setEditOpen(false)
    } catch {
      toast.error('Müşteri güncellenirken hata oluştu')
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomer.mutateAsync(id)
      toast.success('Müşteri silindi')
    } catch {
      toast.error('Müşteri silinirken hata oluştu')
    }
  }

  const handleSetPrice = async (serviceId: string, price: string) => {
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) return

    try {
      await setPrice.mutateAsync({
        customerId: selectedCustomer,
        serviceId,
        price: priceNum,
      })
      toast.success('Fiyat güncellendi')
    } catch {
      toast.error('Fiyat güncellenirken hata oluştu')
    }
  }

  const selectedCustomerData = customers?.find(c => c.id === selectedCustomer)

  // When opening edit dialog from CustomerDetail
  const handleEditFromDetail = (id: string) => {
    setSelectedCustomer(id)
    setEditOpen(true)
  }

  // When opening pricing dialog from CustomerDetail
  const handleSetPricesFromDetail = (id: string) => {
    setSelectedCustomer(id)
    setPricingOpen(true)
  }

  // Show CustomerDetail if a customer is selected
  if (selectedCustomerId) {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCustomerId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <CustomerDetail
              customerId={selectedCustomerId}
              onBack={() => setSelectedCustomerId(null)}
              onEditCustomer={handleEditFromDetail}
              onSetPrices={handleSetPricesFromDetail}
            />
          </motion.div>
        </AnimatePresence>

        {/* Edit Customer Dialog - still accessible from detail view */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Müşteri Düzenle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div className="space-y-2">
                <Label>Ad *</Label>
                <Input name="name" defaultValue={selectedCustomerData?.name} required />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input name="phone" defaultValue={selectedCustomerData?.phone ?? ''} />
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input name="address" defaultValue={selectedCustomerData?.address ?? ''} />
              </div>
              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea name="notes" defaultValue={selectedCustomerData?.notes ?? ''} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? 'Güncelleniyor...' : 'Güncelle'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Customer Pricing Dialog - still accessible from detail view */}
        <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomerData?.name} - Özel Fiyatlar
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {services?.map((service) => {
                const customPrice = prices?.find(p => p.serviceId === service.id)
                const currentPrice = customPrice?.price ?? service.defaultPrice
                const isCustom = !!customPrice

                return (
                  <div key={service.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Varsayılan: ₺{service.defaultPrice.toFixed(2)}/{service.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 h-8 text-sm"
                        defaultValue={currentPrice.toFixed(2)}
                        onBlur={(e) => {
                          const newPrice = e.target.value
                          if (parseFloat(newPrice) !== currentPrice) {
                            handleSetPrice(service.id, newPrice)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const input = e.target as HTMLInputElement
                            handleSetPrice(service.id, input.value)
                          }
                        }}
                      />
                      {isCustom && (
                        <Badge className="text-[10px] shrink-0">Özel</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search with count badge */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {customers && customers.length > 0 && (
          <Badge variant="secondary" className="shrink-0 text-xs px-2.5 py-1">
            {filteredCustomers?.length ?? 0} / {customers.length}
          </Badge>
        )}
      </div>

      {/* Add Customer */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <Button className="w-full h-12 gap-2" onClick={() => setAddOpen(true)}>
          <PlusCircle className="w-5 h-5" />
          Yeni Müşteri Ekle
        </Button>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Müşteri</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label>Ad *</Label>
              <Input name="name" placeholder="Müşteri adı" required />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input name="phone" placeholder="Telefon numarası" />
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Input name="address" placeholder="Adres" />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea name="notes" placeholder="İsteğe bağlı notlar..." rows={2} />
            </div>
            <Button type="submit" className="w-full" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? 'Ekleniyor...' : 'Müşteri Ekle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : filteredCustomers && filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const recordCount = customer._count?.records ?? 0
            // Border accent: more records = more saturated color
            const accentColor = recordCount > 15 ? 'border-l-emerald-500' : recordCount > 8 ? 'border-l-teal-500' : recordCount > 3 ? 'border-l-amber-500' : 'border-l-muted-foreground/30'
            return (
            <Card key={customer.id} className={cn(
              "overflow-hidden hover:shadow-lg transition-all border-l-4",
              accentColor
            )}
            >
              <CardContent className="p-4">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedCustomer(
                    expandedCustomer === customer.id ? null : customer.id
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Initials avatar with hash-based color */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold",
                        getAvatarColor(customer.name)
                      )}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{customer.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </span>
                          )}
                          {customer.address && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" />
                              {customer.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {recordCount} kayıt
                    </Badge>
                    {expandedCustomer === customer.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded content with slide-in animation */}
                <AnimatePresence>
                  {expandedCustomer === customer.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {customer.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            Not: {customer.notes}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCustomerId(customer.id)
                            }}
                          >
                            <Eye className="w-3 h-3" />
                            Detay
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCustomer(customer.id)
                              setPricingOpen(true)
                            }}
                          >
                            <DollarSign className="w-3 h-3" />
                            Fiyatlar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCustomer(customer.id)
                              setEditOpen(true)
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                            Düzenle
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {customer.name} müşterisini silmek istediğinizden emin misiniz? Bu müşteriye ait tüm kayıtlar da silinecektir.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Henüz müşteri yok
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Yeni müşteri eklemek için butona tıklayın
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Müşteri Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label>Ad *</Label>
              <Input name="name" defaultValue={selectedCustomerData?.name} required />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input name="phone" defaultValue={selectedCustomerData?.phone ?? ''} />
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Input name="address" defaultValue={selectedCustomerData?.address ?? ''} />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea name="notes" defaultValue={selectedCustomerData?.notes ?? ''} rows={2} />
            </div>
            <Button type="submit" className="w-full" disabled={updateCustomer.isPending}>
              {updateCustomer.isPending ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Pricing Dialog */}
      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomerData?.name} - Özel Fiyatlar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {services?.map((service) => {
              const customPrice = prices?.find(p => p.serviceId === service.id)
              const currentPrice = customPrice?.price ?? service.defaultPrice
              const isCustom = !!customPrice

              return (
                <div key={service.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Varsayılan: ₺{service.defaultPrice.toFixed(2)}/{service.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-24 h-8 text-sm"
                      defaultValue={currentPrice.toFixed(2)}
                      onBlur={(e) => {
                        const newPrice = e.target.value
                        if (parseFloat(newPrice) !== currentPrice) {
                          handleSetPrice(service.id, newPrice)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const input = e.target as HTMLInputElement
                          handleSetPrice(service.id, input.value)
                        }
                      }}
                    />
                    {isCustom && (
                      <Badge className="text-[10px] shrink-0">Özel</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
