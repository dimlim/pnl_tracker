'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { CryptoIcon } from '@/components/ui/crypto-icon'

function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(4)}`
  if (price < 100) return `$${price.toFixed(2)}`
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function WatchlistWidget() {
  const { data: marketsData } = trpc.markets.getAll.useQuery(
    {
      filter: 'watchlist',
      sortBy: 'market_cap_desc',
      page: 1,
      perPage: 5,
    },
    {
      refetchInterval: 60000,
    }
  )

  const markets = marketsData?.markets || []

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <CardTitle className="text-lg">My Watchlist</CardTitle>
          </div>
          <Link href="/dashboard/markets?filter=watchlist">
            <Button variant="ghost" size="sm">
              View All →
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {markets.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No coins in watchlist</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Search for coins and click the star to add them
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {markets.map((coin) => (
              <Link
                key={coin.id}
                href={`/dashboard/assets/${coin.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Icon */}
                  {coin.iconUrl ? (
                    <img 
                      src={coin.iconUrl} 
                      alt={coin.symbol}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'block'
                      }}
                    />
                  ) : null}
                  <div style={{ display: coin.iconUrl ? 'none' : 'block' }} className="flex-shrink-0">
                    <CryptoIcon symbol={coin.symbol} size={32} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      {coin.symbol}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {coin.name}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right mr-4">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatPrice(coin.currentPrice)}
                  </div>
                </div>

                {/* Change */}
                <div className="text-right min-w-[80px]">
                  <div className={`flex items-center justify-end gap-1 ${
                    coin.priceChange24h >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {coin.priceChange24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-semibold">
                      {coin.priceChange24h >= 0 ? '+' : ''}
                      {coin.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
