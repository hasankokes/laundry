'use client'

import { useState } from 'react'
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from '@/hooks/use-api'
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
  DialogTrigger,
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
import {
  PlusCircle,
  Trash2,
  Pencil,
  Shirt,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

const unitOptions = [
  { value: 'adet', label: 'Adet' },
  { value: 'kg', label: 'Kg' },
  { value: 'takım', label: 'Takım' },
  { value: 'paket', label: 'Paket' },
  { value: 'metre', label: 'Metre' },
]

export function Services() {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: services, isLoading } = useServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

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

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Hizmet ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Add Service */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button className="w-full h-12 gap-2">
            <PlusCircle className="w-5 h-5" />
            Yeni Hizmet Ekle
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Hizmet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="space-y-2">
              <Label>Hizmet Adı *</Label>
              <Input name="name" placeholder="örn: Çarşaf, Havlu, Bornoz..." required />
            </div>
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
            <Button type="submit" className="w-full" disabled={createService.isPending}>
              {createService.isPending ? 'Ekleniyor...' : 'Hizmet Ekle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Service List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : filteredServices && filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Shirt className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{service.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {service.unit}
                        </Badge>
                        <span>
                          ₺{service.defaultPrice.toFixed(2)} / {service.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {service._count?.records ?? 0} kayıt
                    </Badge>
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
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Shirt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Henüz hizmet tanımlanmamış
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Yeni hizmet eklemek için butona tıklayın
              </p>
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
            <Button type="submit" className="w-full" disabled={updateService.isPending}>
              {updateService.isPending ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
