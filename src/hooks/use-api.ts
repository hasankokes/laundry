'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
export interface Customer {
  id: string
  name: string
  phone: string | null
  address: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  _count?: { records: number; prices: number }
  prices?: CustomerPrice[]
}

export interface Service {
  id: string
  name: string
  unit: string
  defaultPrice: number
  createdAt: string
  updatedAt: string
  _count?: { records: number; prices: number }
}

export interface CustomerPrice {
  id: string
  customerId: string
  serviceId: string
  price: number
  createdAt: string
  updatedAt: string
  customer?: { id: string; name: string }
  service?: { id: string; name: string; unit: string; defaultPrice: number }
}

export interface DailyRecord {
  id: string
  customerId: string
  serviceId: string
  date: string
  quantity: number
  unitPrice: number
  total: number
  notes: string | null
  createdAt: string
  updatedAt: string
  customer?: { id: string; name: string; phone: string | null }
  service?: { id: string; name: string; unit: string }
}

export interface ReportData {
  startDate: string
  endDate: string
  customerId: string | null
  summary: {
    totalRevenue: number
    totalQuantity: number
    totalRecordCount: number
    uniqueCustomers: number
    uniqueServices: number
  }
  byService: {
    serviceId: string
    serviceName: string
    unit: string
    totalQuantity: number
    totalRevenue: number
    recordCount: number
  }[]
  byCustomer: {
    customerId: string
    customerName: string
    totalRevenue: number
    recordCount: number
    services: {
      serviceId: string
      serviceName: string
      quantity: number
      revenue: number
    }[]
  }[]
  byDate: {
    date: string
    totalRevenue: number
    recordCount: number
  }[]
}

// Customer hooks
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Müşteriler yüklenemedi')
      return res.json() as Promise<Customer[]>
    },
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; phone?: string; address?: string; notes?: string }) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Müşteri oluşturulamadı')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; phone?: string; address?: string; notes?: string }) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Müşteri güncellenemedi')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Müşteri silinemedi')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

// Service hooks
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error('Hizmetler yüklenemedi')
      return res.json() as Promise<Service[]>
    },
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; unit?: string; defaultPrice?: number }) => {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Hizmet oluşturulamadı')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; unit?: string; defaultPrice?: number }) => {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Hizmet güncellenemedi')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Hizmet silinemedi')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

// Records hooks
export function useRecords(filters?: { customerId?: string; date?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['records', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.customerId) params.set('customerId', filters.customerId)
      if (filters?.date) params.set('date', filters.date)
      if (filters?.startDate) params.set('startDate', filters.startDate)
      if (filters?.endDate) params.set('endDate', filters.endDate)
      const res = await fetch(`/api/records?${params.toString()}`)
      if (!res.ok) throw new Error('Kayıtlar yüklenemedi')
      return res.json() as Promise<DailyRecord[]>
    },
  })
}

export function useCreateRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { customerId: string; serviceId: string; date: string; quantity: number; unitPrice: number; notes?: string }) => {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Kayıt oluşturulamadı')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] })
      qc.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useUpdateRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; quantity?: number; unitPrice?: number; notes?: string }) => {
      const res = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Kayıt güncellenemedi')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] })
      qc.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useDeleteRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Kayıt silinemedi')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] })
      qc.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

// Price hooks
export function usePrices(customerId?: string) {
  return useQuery({
    queryKey: ['prices', customerId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (customerId) params.set('customerId', customerId)
      const res = await fetch(`/api/prices?${params.toString()}`)
      if (!res.ok) throw new Error('Fiyatlar yüklenemedi')
      return res.json() as Promise<CustomerPrice[]>
    },
    enabled: !!customerId,
  })
}

export function useSetPrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { customerId: string; serviceId: string; price: number }) => {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Fiyat kaydedilemedi')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prices'] }),
  })
}

export function useDeletePrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/prices/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Fiyat silinemedi')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prices'] }),
  })
}

// Report hooks
export function useReport(startDate: string, endDate: string, customerId?: string) {
  return useQuery({
    queryKey: ['reports', startDate, endDate, customerId],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate })
      if (customerId) params.set('customerId', customerId)
      const res = await fetch(`/api/reports?${params.toString()}`)
      if (!res.ok) throw new Error('Rapor yüklenemedi')
      return res.json() as Promise<ReportData>
    },
    enabled: !!startDate && !!endDate,
  })
}
