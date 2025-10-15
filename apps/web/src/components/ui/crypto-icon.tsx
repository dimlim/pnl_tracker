'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CryptoIconProps {
  symbol: string
  size?: number
  className?: string
}

export function CryptoIcon({ symbol, size = 24, className }: CryptoIconProps) {
  const symbolLower = symbol.toLowerCase()
  
  // Fallback to text if image fails
  const handleError = (e: any) => {
    e.target.style.display = 'none'
    const parent = e.target.parentElement
    if (parent) {
      parent.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-white/10 rounded-full text-xs font-semibold">${symbol.slice(0, 2)}</div>`
    }
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
        onError={handleError}
        unoptimized
      />
    </div>
  )
}
