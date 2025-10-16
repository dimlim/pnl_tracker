import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/lib/trpc/client'
import { Toaster } from 'sonner'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

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
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-body antialiased`}>
        <TRPCProvider>
          <div className="min-h-screen bg-background bg-grid-pattern">
            {children}
          </div>
          <Toaster 
            position="top-right"
            expand={true}
            richColors
            closeButton
            theme="dark"
          />
        </TRPCProvider>
      </body>
    </html>
  )
}
