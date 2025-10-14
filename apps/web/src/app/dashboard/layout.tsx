import { Navbar } from '@/components/dashboard/navbar'
import { PriceUpdater } from '@/components/dashboard/price-updater'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <PriceUpdater />
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
