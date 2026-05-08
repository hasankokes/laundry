'use client'

import { useState } from 'react'
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useRecords,
  useToggleServiceFavorite,
  useReorderServices,
} from '@/hooks/use-api'
import {
  PlusCircle,
  Trash2,
  Pencil,
  Shirt,
  Search,
  TrendingUp,
  DollarSign,
  Star,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const unitOptions = [
  { value: 'adet', label: 'Adet' },
  { value: 'kg', label: 'Kg' },
  { value: 'takım', label: 'Takım' },
  { value: 'paket', label: 'Paket' },
  { value: 'metre', label: 'Metre' },
]

const SERVICE_GRADIENTS = [
  'from-teal-500 to-teal-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-sky-600',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-600',
]

const SERVICE_ICONS = ['🧺', '🧹', '👔', '🛏️', '🏠', '✨', '🧽', '💫']

const SERVICE_ICON_MAP: Record<string, string> = {
  'çarşaf': '🛏️',
  'nevresim': '🛏️',
  'yastık kılıfı': '🧸',
  'yastık': '🧸',
  'büyük havlu': '🛁',
  'küçük havlu': '🛁',
  'el havlusu': '🛁',
  'ayak havlusu': '🛁',
  'traş havlusu': '🛁',
  'havlu': '🛁',
  'bornoz': '🧥',
  'peştemal': '🧖',
  'pike': '🛏️',
  'alez': '🛏️',
  'yorgan': '🛏️',
  'masa örtüsü': '🍽️',
  'perde': '🪟',
  'kapak': '🛏️',
  'bebek çarşafı': '👶',
  'bebek nevresimi': '👶',
  'peçete': '🍽️',
  'pede': '🛏️',
  'kılım': '🧺',
  'runner': '🍽️',
  'kilim': '🧹',
  'yıkama': '🧺',
  'kuru temizleme': '👔',
  'ütüleme': '👔',
  'halı': '🧹',
}

function getServiceIcon(name: string, index: number): string {
  const key = name.toLowerCase().trim()
  for (const [k, v] of Object.entries(SERVICE_ICON_MAP)) {
    if (key.includes(k)) return v
  }
  return SERVICE_ICONS[index % SERVICE_ICONS.length]
}

export function Services() {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: services, isLoading } = useServices()
  const { data: records } = useRecords({})
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()
  const toggleFavorite = useToggleServiceFavorite()
  const reorderMutation = useReorderServices()



  const filteredServices = searchQuery
    ? services?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : services

  const handleAddService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const unit = formData.get('unit') as string
    const defaultPrice = parseFloat(formData.get('defaultPrice') as string)

    if (!name?.trim()) {
      toast.error('Hizmet adı gereklidir')
      return
    }

    try {
      await createService.mutateAsync({
        name: name.trim(),
        unit: unit || 'adet',
        defaultPrice: isNaN(defaultPrice) ? 0 : defaultPrice,
      })
      toast.success('Hizmet eklendi')
      setAddOpen(false)
    } catch {
      toast.error('Hizmet eklenirken hata oluştu')
    }
  }

  const handleEditService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const unit = formData.get('unit') as string
    const defaultPrice = parseFloat(formData.get('defaultPrice') as string)

    try {
      await updateService.mutateAsync({
        id: selectedService,
        name: name.trim(),
        unit: unit || 'adet',
        defaultPrice: isNaN(defaultPrice) ? 0 : defaultPrice,
      })
      toast.success('Hizmet güncellendi')
      setEditOpen(false)
    } catch {
      toast.error('Hizmet güncellenirken hata oluştu')
    }
  }

  const handleDeleteService = async (id: string) => {
    try {
      await deleteService.mutateAsync(id)
      toast.success('Hizmet silindi')
    } catch {
      toast.error('Hizmet silinirken hata oluştu')
    }
  }

  const selectedServiceData = services?.find(s => s.id === selectedService)

  const handleMoveService = (id: string, direction: 'up' | 'down') => {
    if (!filteredServices) return
    const index = filteredServices.findIndex(s => s.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === filteredServices.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const reordered = [...filteredServices]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    reorderMutation.mutate(reordered.map((s: any, i: number) => ({ id: s.id, displayOrder: i, isFavorite: s.isFavorite })))
  }

  // Get total records across all services
  const totalRecords = services?.reduce((sum, s) => sum + (s._count?.records ?? 0), 0) ?? 0

  return (
    <div className="space-y-4">
      {/* Search and Stats */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Hizmet ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 px-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          {totalRecords} toplam kayıt
        </div>
      </div>

      {/* Add Service - with pulse animation */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <Button className="w-full h-12 gap-2 relative group" onClick={() => setAddOpen(true)}>
          <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Yeni Hizmet Ekle
          <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-white/80 pulse-dot-anim" />
        </Button>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Hizmet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="space-y-2">
              <Label>Hizmet Adı *</Label>
              <Input name="name" placeholder="örn: Çarşaf, Havlu, Bornoz..." required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Birim</Label>
                <Select name="unit" defaultValue="adet">
                  <SelectTrigger>
                    <SelectValue placeholder="Birim seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Varsayılan Fiyat (₺)</Label>
                <Input
                  type="number"
                  name="defaultPrice"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  placeholder="0.00"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createService.isPending}>
              {createService.isPending ? 'Ekleniyor...' : 'Hizmet Ekle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Service List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : filteredServices && filteredServices.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => (
                <ServiceCard 
                  key={service.id} 
                  service={service} 
                  index={index} 
                  totalRecords={totalRecords} 
                  records={records} 
                  setSelectedService={setSelectedService} 
                  setEditOpen={setEditOpen} 
                  handleDeleteService={handleDeleteService} 
                  toggleFavorite={toggleFavorite}
                  onMove={handleMoveService}
                  isFirst={index === 0}
                  isLast={index === filteredServices.length - 1}
                />
              ))}
            </AnimatePresence>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Shirt className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Henüz hizmet tanımlanmamış
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Yeni hizmet eklemek için butona tıklayın
              </p>
              <Button variant="outline" className="gap-2" onClick={() => setAddOpen(true)}>
                <PlusCircle className="w-4 h-4" />
                Hizmet Ekle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hizmet Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditService} className="space-y-4">
            <div className="space-y-2">
              <Label>Hizmet Adı *</Label>
              <Input name="name" defaultValue={selectedServiceData?.name} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Birim</Label>
                <Select name="unit" defaultValue={selectedServiceData?.unit ?? 'adet'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Birim seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Varsayılan Fiyat (₺)</Label>
                <Input
                  type="number"
                  name="defaultPrice"
                  min="0"
                  step="0.01"
                  defaultValue={selectedServiceData?.defaultPrice ?? 0}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={updateService.isPending}>
              {updateService.isPending ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ServiceCard({ service, index, totalRecords, records, setSelectedService, setEditOpen, handleDeleteService, toggleFavorite, onMove, isFirst, isLast }: any) {

  const recordCount = service._count?.records ?? 0
  const recordPercent = totalRecords > 0 ? (recordCount / totalRecords) * 100 : 0
  const gradient = SERVICE_GRADIENTS[index % SERVICE_GRADIENTS.length]
  const icon = getServiceIcon(service.name, index)
  const serviceRevenue = records?.filter((r: any) => r.serviceId === service.id).reduce((sum: number, r: any) => sum + r.total, 0) ?? 0

  return (
    <div className="overflow-hidden hover:shadow-md transition-all group">
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <CardContent className="p-0">
          <div className="flex">
            {/* Order buttons */}
            <div className="flex flex-col border-r bg-muted/30">
              <button
                onClick={() => onMove(service.id, 'up')}
                disabled={isFirst}
                className={cn(
                  "flex-1 flex items-center justify-center w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-90 active:bg-muted/80",
                  isFirst && "opacity-0 pointer-events-none"
                )}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onMove(service.id, 'down')}
                disabled={isLast}
                className={cn(
                  "flex-1 flex items-center justify-center w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-90 active:bg-muted/80",
                  isLast && "opacity-0 pointer-events-none"
                )}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Color Accent */}
            <div className={`w-2 bg-gradient-to-b ${gradient} shrink-0`} />

            <div className="flex-1 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                    <span className="text-lg">{icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{service.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {service.unit}
                      </Badge>
                      <span className="text-xs font-semibold text-primary group-hover:text-primary/80 transition-colors">
                        ₺{service.defaultPrice.toFixed(2)} / {service.unit}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Star / Favorite toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite.mutate({ id: service.id, isFavorite: !service.isFavorite })
                    }}
                    className={cn("p-1 rounded-md hover:bg-muted transition-colors", service.isFavorite && "text-yellow-500")}
                  >
                    <Star className={cn("w-4 h-4", service.isFavorite ? "fill-yellow-500" : "fill-none")} />
                  </button>
                  {/* Revenue indicator */}
                  {serviceRevenue > 0 && (
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <DollarSign className="w-3 h-3" />
                        <span className="text-xs font-bold">₺{serviceRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  )}
                  {/* Record count with progress */}
                  <div className="text-right mr-1 hidden sm:block">
                    <p className="text-xs font-medium">{recordCount} kayıt</p>
                    <div className="w-16 h-1 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                        style={{ width: `${Math.max(recordPercent, 2)}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedService(service.id)
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hizmeti Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          {service.name} hizmetini silmek istediğinizden emin misiniz? Bu hizmete ait tüm kayıtlar da silinecektir.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </motion.div>
    </div>
  )
}
