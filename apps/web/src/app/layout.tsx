import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/lib/trpc/client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Crypto PnL Tracker',
  description: 'Professional cryptocurrency portfolio tracking with advanced PnL calculations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <TRPCProvider>
          <div className="min-h-screen bg-background bg-grid-pattern">
            {children}
          </div>
        </TRPCProvider>
      </body>
    </html>
  )
}
