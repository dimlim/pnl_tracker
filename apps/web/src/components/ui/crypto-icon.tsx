'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CryptoIconProps {
  symbol: string
  iconUrl?: string | null
  size?: number
  className?: string
}

export function CryptoIcon({ symbol, iconUrl, size = 24, className }: CryptoIconProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const symbolLower = symbol.toLowerCase()

  // If we have icon_url from database, use it
  if (iconUrl && !error) {
    return (
      <div 
        className={cn("relative flex-shrink-0", className)}
        style={{ width: size, height: size }}
      >
        {loading && (
          <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
        )}
        <Image
          src={iconUrl}
          alt={symbol}
          width={size}
          height={size}
          className="rounded-full"
          onError={() => setError(true)}
          onLoad={() => setLoading(false)}
          loading="lazy"
          unoptimized
        />
      </div>
    )
  }

  // Fallback to cryptocurrency-icons library
  if (!error) {
    return (
      <div 
        className={cn("relative flex-shrink-0", className)}
        style={{ width: size, height: size }}
      >
        {loading && (
          <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
        )}
        <Image
          src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbolLower}.png`}
          alt={symbol}
          width={size}
          height={size}
          className="rounded-full"
          onError={() => setError(true)}
          onLoad={() => setLoading(false)}
          loading="lazy"
          unoptimized
        />
      </div>
    )
  }

  // Final fallback: gradient circle with symbol
  return (
    <div 
      className={cn(
        "relative flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold",
        "bg-gradient-to-br from-violet-500 to-fuchsia-500",
        className
      )}
      style={{ width: size, height: size }}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  )
}
