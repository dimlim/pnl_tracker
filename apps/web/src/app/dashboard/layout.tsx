'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/dashboard/navbar'
import { PriceUpdater } from '@/components/dashboard/price-updater'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { QuickAddDialog } from '@/components/transactions/quick-add-dialog'
import { Plus } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // Keyboard shortcut: Shift + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setIsQuickAddOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen">
      <PriceUpdater />
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      {/* Floating Action Button */}
      <FloatingActionButton
        icon={Plus}
        onClick={() => setIsQuickAddOpen(true)}
        label="Quick Add Transaction (Shift+A)"
      />

      {/* Quick Add Dialog */}
      <QuickAddDialog
        open={isQuickAddOpen}
        onOpenChange={setIsQuickAddOpen}
      />
    </div>
  )
}
