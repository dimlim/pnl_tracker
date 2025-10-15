'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CryptoIconProps {
  symbol: string
  size?: number
  className?: string
}

export function CryptoIcon({ symbol, size = 24, className }: CryptoIconProps) {
  const [error, setError] = useState(false)
  const symbolLower = symbol.toLowerCase()

  if (error) {
    return (
      <div 
        className={cn("relative flex-shrink-0 flex items-center justify-center bg-white/10 rounded-full text-xs font-semibold", className)}
        style={{ width: size, height: size }}
      >
        {symbol.slice(0, 2)}
      </div>
    )
  }

  return (
    <div 
      className={cn("relative flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${symbolLower}.png`}
        alt={symbol}
        width={size}
        height={size}
        className="rounded-full"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}
