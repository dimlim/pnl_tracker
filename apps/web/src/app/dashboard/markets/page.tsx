'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Search, Star, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { TopGainersWidget } from '@/components/markets/top-gainers-widget'
import { TopLosersWidget } from '@/components/markets/top-losers-widget'
import { PercentBadge } from '@/components/markets/percent-badge'
import { MiniSparkline } from '@/components/markets/mini-sparkline'
import { CryptoIcon } from '@/components/ui/crypto-icon'
import { GlobalSearch } from '@/components/markets/global-search'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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

function MarketsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b animate-pulse">
          <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  )
}

type SortField = 'rank' | 'name' | 'price' | 'change_1h' | 'change_24h' | 'change_7d' | 'market_cap' | 'volume'
type SortDirection = 'asc' | 'desc'

export default function MarketsPage() {
  const [filter, setFilter] = useState<'all' | 'watchlist' | 'holdings'>('all')
  const [sortField, setSortField] = useState<SortField>('market_cap')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  const utils = trpc.useUtils()

  // Construct sortBy string for API
  const sortBy = `${sortField}_${sortDirection}`

  // Handle column header click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with default direction
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-40" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    )
  }

  const { data: marketsData, isLoading } = trpc.markets.getAll.useQuery(
    {
      filter,
      sortBy,
      search: debouncedSearch,
      page: 1,
      perPage: 100,
    },
    {
      refetchInterval: 60000, // Update every minute
    }
  )

  const { data: watchlistCount } = trpc.markets.getWatchlistCount.useQuery(undefined, {
    enabled: true,
  })

  const toggleWatchlist = trpc.markets.toggleWatchlist.useMutation({
    onSuccess: (data) => {
      toast.success(data.added ? 'Added to watchlist' : 'Removed from watchlist')
      utils.markets.getAll.invalidate()
      utils.markets.getWatchlistCount.invalidate()
    },
    onError: () => {
      toast.error('Failed to update watchlist')
    },
  })

  const markets = marketsData?.markets || []
  const holdingsCount = 0 // TODO: Calculate from actual holdings

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Markets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Live cryptocurrency prices and statistics
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Live updates</span>
        </div>
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopGainersWidget />
        <TopLosersWidget />
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Global Search - Can find ALL cryptocurrencies */}
            <div className="flex items-center gap-4">
              <GlobalSearch />
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Search 10,000+ coins
              </div>
            </div>

            {/* Filters and Table Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Table Filter Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Filter table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Tabs */}
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="watchlist">
                    Watchlist ({watchlistCount || 0})
                  </TabsTrigger>
                  <TabsTrigger value="holdings">Holdings ({holdingsCount})</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Sort Info */}
              <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Click headers to sort
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <MarketsTableSkeleton />
          ) : markets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No cryptocurrencies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600 dark:text-gray-400">
                    <th className="pb-3 font-medium">
                      <button
                        onClick={() => handleSort('rank')}
                        className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        #
                        <SortIcon field="rank" />
                      </button>
                    </th>
                    <th className="pb-3 font-medium">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        Name
                        <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="pb-3 font-medium text-right">
                      <button
                        onClick={() => handleSort('price')}
                        className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        Price
                        <SortIcon field="price" />
                      </button>
                    </th>
                    <th className="pb-3 font-medium text-right">
                      <button
                        onClick={() => handleSort('change_1h')}
                        className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        1h %
                        <SortIcon field="change_1h" />
                      </button>
                    </th>
                    <th className="pb-3 font-medium text-right">
                      <button
                        onClick={() => handleSort('change_24h')}
                        className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        24h %
                        <SortIcon field="change_24h" />
                      </button>
                    </th>
                    <th className="pb-3 font-medium text-right">
                      <button
                        onClick={() => handleSort('change_7d')}
                        className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        7d %
                        <SortIcon field="change_7d" />
                      </button>
                    </th>
                    <th className="pb-3 font-medium text-right">
                      <button
                        onClick={() => handleSort('market_cap')}
                        className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        Market Cap
                        <SortIcon field="market_cap" />
                      </button>
                    </th>
                    <th className="pb-3 font-medium text-right">
                      <button
                        onClick={() => handleSort('volume')}
                        className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        Volume (24h)
                        <SortIcon field="volume" />
                      </button>
                    </th>
                    <th className="pb-3 font-medium text-center">Last 7 Days</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((coin) => (
                    <tr
                      key={coin.id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-4">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {coin.rank}
                        </span>
                      </td>

                      {/* Name + Icon */}
                      <td className="py-4">
                        <Link
                          href={`/dashboard/assets/${coin.id}`}
                          className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                        >
                          <CryptoIcon symbol={coin.symbol} size={32} />
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {coin.name}
                              {(coin as any).isInPortfolio && (
                                <Badge variant="outline" className="text-xs">
                                  Holding
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {coin.symbol}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Price */}
                      <td className="py-4 text-right">
                        <div className="font-semibold">{formatPrice(coin.currentPrice)}</div>
                      </td>

                      {/* 1h Change */}
                      <td className="py-4 text-right">
                        <PercentBadge value={coin.priceChange1h} size="sm" />
                      </td>

                      {/* 24h Change */}
                      <td className="py-4 text-right">
                        <PercentBadge value={coin.priceChange24h} size="sm" />
                      </td>

                      {/* 7d Change */}
                      <td className="py-4 text-right">
                        <PercentBadge value={coin.priceChange7d} size="sm" />
                      </td>

                      {/* Market Cap */}
                      <td className="py-4 text-right">
                        <div className="font-medium">
                          ${formatLargeNumber(coin.marketCap)}
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="py-4 text-right">
                        <div className="text-gray-600 dark:text-gray-400">
                          ${formatLargeNumber(coin.volume24h)}
                        </div>
                      </td>

                      {/* Sparkline */}
                      <td className="py-4">
                        <div className="flex justify-center">
                          <MiniSparkline
                            data={coin.sparkline7d}
                            color={coin.priceChange7d >= 0 ? 'green' : 'red'}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWatchlist.mutate({ assetId: coin.id })}
                            disabled={toggleWatchlist.isPending}
                          >
                            <Star
                              className={cn(
                                'w-4 h-4',
                                (coin as any).isWatchlisted &&
                                  'fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500'
                              )}
                            />
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/assets/${coin.id}`}>
                              <Plus className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {markets.length} of {marketsData?.total || 0} cryptocurrencies
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
