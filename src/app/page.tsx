'use client'

import { useAppStore, TabType } from '@/lib/store'
import { Dashboard } from '@/components/dashboard'
import { DailyEntry } from '@/components/daily-entry'
import { Customers } from '@/components/customers'
import { Services } from '@/components/services'
import { Reports } from '@/components/reports'
import {
  Home,
  PlusCircle,
  Users,
  Shirt,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Ana Sayfa', icon: Home },
  { id: 'daily-entry', label: 'Giriş', icon: PlusCircle },
  { id: 'customers', label: 'Müşteriler', icon: Users },
  { id: 'services', label: 'Hizmetler', icon: Shirt },
  { id: 'reports', label: 'Raporlar', icon: FileText },
]

const tabComponents: Record<TabType, React.ComponentType> = {
  dashboard: Dashboard,
  'daily-entry': DailyEntry,
  customers: Customers,
  services: Services,
  reports: Reports,
}

export default function HomePage() {
  const { activeTab, setActiveTab } = useAppStore()
  const ActiveComponent = tabComponents[activeTab]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Çamaşırhane</h1>
              <p className="text-xs text-primary-foreground/70 leading-tight">Yönetim Sistemi</p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block border-t border-primary-foreground/10">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-t-lg',
                      activeTab === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <ActiveComponent />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg safe-bottom">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 transition-all',
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 transition-all',
                  activeTab === tab.id && 'scale-110'
                )} />
                <span className="text-[10px] font-medium truncate">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
