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
      staleTime: 600000, // Cache for 10 minutes (matches server cache)
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

  // Don't use sparkline fallback - show proper error instead
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-gray-500 dark:text-gray-400">
          Unable to load price history
        </p>
        <p className="text-sm text-gray-400">
          {priceHistory ? 'No price data available' : 'API rate limit reached'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
