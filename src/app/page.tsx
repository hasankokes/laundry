'use client'

import { useAppStore, TabType } from '@/lib/store'
import { Dashboard } from '@/components/dashboard'
import { DailyEntry } from '@/components/daily-entry'
import { Customers } from '@/components/customers'
import { Services } from '@/components/services'
import { Reports } from '@/components/reports'
import { Settings } from '@/components/settings'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Home,
  PlusCircle,
  Users,
  Shirt,
  FileText,
  Settings as SettingsIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Ana Sayfa', icon: Home },
  { id: 'daily-entry', label: 'Giriş', icon: PlusCircle },
  { id: 'customers', label: 'Müşteriler', icon: Users },
  { id: 'services', label: 'Hizmetler', icon: Shirt },
  { id: 'reports', label: 'Raporlar', icon: FileText },
  { id: 'settings', label: 'Ayarlar', icon: SettingsIcon },
]

const tabComponents: Record<TabType, React.ComponentType> = {
  dashboard: Dashboard,
  'daily-entry': DailyEntry,
  customers: Customers,
  services: Services,
  reports: Reports,
  settings: Settings,
}

export default function HomePage() {
  const { activeTab, setActiveTab } = useAppStore()
  const ActiveComponent = tabComponents[activeTab]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary via-primary to-teal-600 text-primary-foreground shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">Çamaşırhane</h1>
              <p className="text-[10px] text-primary-foreground/60 leading-tight font-medium uppercase tracking-widest">Yönetim Sistemi</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block border-t border-primary-foreground/10">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-t-lg',
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="desktop-tab-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg safe-bottom">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 transition-all',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    'w-5 h-5 transition-all duration-200',
                    isActive && 'scale-110'
                  )} />
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab-dot"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium truncate transition-all',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
