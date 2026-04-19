'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
export interface Customer {
  id: string
  name: string
  phone: string | null
  address: string | null
  taxNumber: string | null
  notes: string | null
  tag: string | null
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
  displayOrder?: number
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
  isFavorite?: boolean
  displayOrder?: number
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

export interface CustomerHistoryData {
  customer: {
    id: string
    name: string
    phone: string | null
    address: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
  }
  totalBalance: number
  recordCount: number
  activeServicesCount: number
  serviceBreakdown: {
    serviceId: string
    serviceName: string
    unit: string
    totalQuantity: number
    totalRevenue: number
  }[]
  monthlySummary: {
    month: string
    totalRevenue: number
    recordCount: number
  }[]
  recentRecords: {
    id: string
    date: string
    serviceId: string
    serviceName: string
    quantity: number
    unitPrice: number
    total: number
    notes: string | null
  }[]
  customPrices: {
    id: string
    serviceId: string
    serviceName: string
    unit: string
    defaultPrice: number
    customPrice: number
  }[]
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
    mutationFn: async (data: { name: string; phone?: string; address?: string; notes?: string; tag?: string }) => {
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
    mutationFn: async ({ id, ...data }: { id: string; name?: string; phone?: string; address?: string; notes?: string; tag?: string }) => {
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

export function useCustomerHistory(customerId: string | null, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['customer-history', customerId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      const res = await fetch(`/api/customers/${customerId}/history?${params.toString()}`)
      if (!res.ok) throw new Error('Müşteri geçmişi yüklenemedi')
      return res.json() as Promise<CustomerHistoryData>
    },
    enabled: !!customerId,
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

// Invoice types
export interface InvoiceData {
  invoiceNumber: string
  customer: {
    id: string
    name: string
    phone: string | null
    address: string | null
  }
  startDate: string
  endDate: string
  dueDate: string
  lineItems: {
    serviceId: string
    serviceName: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  subtotal: number
  kdvRate: number
  kdvAmount: number
  grandTotal: number
  createdAt: string
  recordCount: number
}

// Invoice hooks
export function useInvoice(startDate: string, endDate: string, customerId: string, kdvRate?: number, dueDays?: number) {
  return useQuery({
    queryKey: ['invoice', startDate, endDate, customerId, kdvRate, dueDays],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate, customerId })
      if (kdvRate !== undefined) params.set('kdvRate', String(kdvRate))
      if (dueDays !== undefined) params.set('dueDays', String(dueDays))
      const res = await fetch(`/api/invoice?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fatura yüklenemedi')
      }
      return res.json() as Promise<InvoiceData>
    },
    enabled: !!startDate && !!endDate && !!customerId,
  })
}

// Dashboard types
export interface DashboardData {
  weeklyComparison: {
    thisWeek: number
    lastWeek: number
    change: number
  }
  currentStreak: number
  bestDay: {
    date: string
    amount: number
  }
  monthlyTarget: {
    current: number
    target: number
    percentage: number
  }
  revenueByDayOfWeek: {
    day: string
    average: number
    total: number
    dayCount: number
  }[]
  topGrowthCustomer: {
    name: string
    thisMonth: number
    lastMonth: number
    change: number
  } | null
}

// Dashboard hooks
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Dashboard verileri yüklenemedi')
      return res.json() as Promise<DashboardData>
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Payment types
export interface Payment {
  id: string
  customerId: string
  amount: number
  date: string
  method: string
  description: string | null
  createdAt: string
  updatedAt: string
  customer?: { id: string; name: string; phone: string | null }
}

export interface CustomerBalance {
  totalDebit: number
  totalCredit: number
  balance: number
  recentPayments: Payment[]
}

// Payment hooks
export function usePayments(filters?: { customerId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.customerId) params.set('customerId', filters.customerId)
      if (filters?.startDate) params.set('startDate', filters.startDate)
      if (filters?.endDate) params.set('endDate', filters.endDate)
      const res = await fetch(`/api/payments?${params.toString()}`)
      if (!res.ok) throw new Error('Ödemeler yüklenemedi')
      return res.json() as Promise<Payment[]>
    },
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { customerId: string; amount: number; date: string; method?: string; description?: string }) => {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Ödeme oluşturulamadı')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['customer-balance'] })
    },
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Ödeme silinemedi')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['customer-balance'] })
    },
  })
}

export function useCustomerBalance(customerId: string | null) {
  return useQuery({
    queryKey: ['customer-balance', customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}/balance`)
      if (!res.ok) throw new Error('Bakiye yüklenemedi')
      return res.json() as Promise<CustomerBalance>
    },
    enabled: !!customerId,
  })
}

// Balance Overview types
export interface BalanceOverviewItem {
  customerId: string
  customerName: string
  phone: string | null
  tag: string | null
  totalDebit: number
  totalCredit: number
  balance: number
}

// Balance Overview hooks
export function useBalanceOverview() {
  return useQuery({
    queryKey: ['balance-overview'],
    queryFn: async () => {
      const res = await fetch('/api/balance')
      if (!res.ok) throw new Error('Bakiye özeti yüklenemedi')
      return res.json() as Promise<BalanceOverviewItem[]>
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
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

export function useToggleCustomerFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite }),
      })
      if (!res.ok) throw new Error('Failed to toggle favorite')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }) },
  })
}

export function useReorderCustomers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (items: { id: string; displayOrder: number; isFavorite?: boolean }[]) => {
      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error('Failed to reorder')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }) },
  })
}

export function useToggleServiceFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite }),
      })
      if (!res.ok) throw new Error('Failed to toggle favorite')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }) },
  })
}

export function useReorderServices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (items: { id: string; displayOrder: number; isFavorite?: boolean }[]) => {
      const res = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error('Failed to reorder')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }) },
  })
}
