'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { CryptoIcon } from '@/components/ui/crypto-icon'

function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(4)}`
  if (price < 100) return `$${price.toFixed(2)}`
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toFixed(2)
}

function TopGainersSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/30 animate-pulse">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-6 h-4 bg-white/50 rounded" />
            <div className="w-8 h-8 bg-white/50 rounded-full" />
            <div className="space-y-2">
              <div className="w-20 h-4 bg-white/50 rounded" />
              <div className="w-16 h-3 bg-white/50 rounded" />
            </div>
          </div>
          <div className="w-24 h-6 bg-white/50 rounded" />
        </div>
      ))}
    </div>
  )
}

export function TopGainersWidget() {
  const { data: gainers, isLoading } = trpc.markets.getTopGainers.useQuery(
    {
      limit: 5,
      timeframe: '24h',
    },
    {
      refetchInterval: 30000, // Update every 30s
    }
  )

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-green-900 dark:text-green-100">
              🔥 Top Gainers (24h)
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TopGainersSkeleton />
        ) : (
          <>
            <div className="space-y-3">
              {gainers?.map((coin, index) => (
                <Link
                  key={coin.id}
                  href={`/dashboard/assets/${coin.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors group"
                >
                  {/* Rank */}
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 w-6">
                      #{index + 1}
                    </span>

                    {/* Icon + Name */}
                    <div className="flex items-center gap-2">
                      <CryptoIcon symbol={coin.symbol} size={32} />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {coin.symbol}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {coin.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right mr-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatPrice(coin.currentPrice)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Vol: ${formatLargeNumber(coin.volume24h)}
                    </div>
                  </div>

                  {/* Change */}
                  <div className="text-right min-w-[100px]">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        +{coin.priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      +${Math.abs(coin.currentPrice * (coin.priceChange24h / 100)).toFixed(2)}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </Link>
              ))}
            </div>

            {/* See All link */}
            <Link
              href="/dashboard/markets?filter=gainers"
              className="block mt-4 text-center text-sm text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
            >
              View All Gainers →
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
