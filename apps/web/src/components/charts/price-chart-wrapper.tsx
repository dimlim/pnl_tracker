'use client'

import { trpc } from '@/lib/trpc'
import { PriceChartWithTransactions } from './price-chart-with-transactions'

interface PriceChartWrapperProps {
  coinId: string
  days: number | 'max'
  period: string
  coin: any
  holdings: any
}

export function PriceChartWrapper({ coinId, days, period, coin, holdings }: PriceChartWrapperProps) {
  // This component will be remounted when period changes due to key prop
  const { data: priceHistory, isLoading } = trpc.markets.getPriceHistory.useQuery(
    { coinId, days },
    { 
      enabled: !!coin,
      staleTime: 60000, // Cache for 60 seconds (matches server cache)
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  )

  console.log('🔄 PriceChartWrapper render:', {
    period,
    days,
    coinId,
    isLoading,
    hasPriceData: !!priceHistory?.prices?.length,
    pricesCount: priceHistory?.prices?.length || 0,
  })

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Loading {period.toUpperCase()} data...</p>
        </div>
      </div>
    )
  }

  if (priceHistory && priceHistory.prices.length > 0) {
    return (
      <PriceChartWithTransactions
        priceData={priceHistory.prices}
        transactions={priceHistory.transactions}
        avgBuyPrice={holdings?.avgBuyPrice}
        symbol={coin.symbol}
        currentPrice={coin.currentPrice}
      />
    )
  }

  if (coin.sparkline7d && coin.sparkline7d.length > 0) {
    return (
      <PriceChartWithTransactions
        sparkline={coin.sparkline7d}
        transactions={priceHistory?.transactions || []}
        avgBuyPrice={holdings?.avgBuyPrice}
        symbol={coin.symbol}
        currentPrice={coin.currentPrice}
      />
    )
  }

  return (
    <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
      Chart data not available
    </div>
  )
}
