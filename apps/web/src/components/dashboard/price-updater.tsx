'use client'

import { usePriceUpdates } from '@/hooks/use-price-updates'

export function PriceUpdater() {
  // Update prices every 60 seconds
  usePriceUpdates(60000)
  
  return null
}
