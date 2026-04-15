import { create } from 'zustand'

export type TabType = 'dashboard' | 'daily-entry' | 'customers' | 'services' | 'reports' | 'settings'

interface AppState {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  selectedMonth: string // YYYY-MM format
  setSelectedMonth: (month: string) => void
}

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedMonth: getCurrentMonth(),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}))
