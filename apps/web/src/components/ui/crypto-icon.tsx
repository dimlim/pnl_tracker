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
  
  // Use CoinGecko API images as primary source
  const coinGeckoId = getCoinGeckoId(symbolLower)

  if (error || !coinGeckoId) {
    // Fallback to colored circle with symbol
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

  return (
    <div 
      className={cn("relative flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={`https://assets.coingecko.com/coins/images/${coinGeckoId}/small/${symbolLower}.png`}
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

// Map common symbols to CoinGecko IDs
function getCoinGeckoId(symbol: string): string | null {
  const mapping: Record<string, string> = {
    'btc': '1/bitcoin',
    'eth': '279/ethereum',
    'sol': '4128/solana',
    'usdt': '325/tether',
    'usdc': '6319/usd-coin',
    'bnb': '825/binancecoin',
    'xrp': '44/ripple',
    'ada': '975/cardano',
    'doge': '5/dogecoin',
    'matic': '4713/matic-network',
    'dot': '12171/polkadot',
    'dai': '11841/dai',
    'avax': '12559/avalanche-2',
    'link': '1975/chainlink',
    'uni': '12504/uniswap',
    'atom': '3794/cosmos',
    'ltc': '2/litecoin',
    'etc': '1321/ethereum-classic',
    'xlm': '5/stellar',
    'algo': '4030/algorand',
    'enso': '1/bitcoin', // Fallback for unknown
  }
  
  return mapping[symbol] || null
}
