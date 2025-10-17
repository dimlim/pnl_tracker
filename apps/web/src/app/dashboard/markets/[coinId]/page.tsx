'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Star,
  Plus,
  ExternalLink,
  Globe,
  Twitter,
  Github,
  Wallet,
  DollarSign,
  Target,
  PieChart
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { CryptoIcon } from '@/components/ui/crypto-icon'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PriceChartWithTransactions } from '@/components/charts/price-chart-with-transactions'

function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(4)}`
  if (price < 100) return `$${price.toFixed(2)}`
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toLocaleString()}`
}

export default function CoinDetailsPage({ params }: { params: Promise<{ coinId: string }> }) {
  const { coinId } = use(params)
  const [chartPeriod, setChartPeriod] = useState<'24h' | '7d' | '1m' | '3m' | '1y' | 'max'>('7d')
  const [chartType, setChartType] = useState<'line' | 'candle'>('line')
  const [isLogScale, setIsLogScale] = useState(false)

  const utils = trpc.useUtils()

  // Get coin data from markets endpoint
  const { data: marketsData, isLoading } = trpc.markets.getAll.useQuery({
    filter: 'all',
    sortBy: 'market_cap_desc',
    page: 1,
    perPage: 250,
  })

  const coin = marketsData?.markets.find((m) => m.id === coinId)

  // Get portfolio holdings for this coin
  const { data: holdings, isLoading: holdingsLoading, error: holdingsError } = trpc.markets.getCoinHoldings.useQuery(
    { coinId },
    { enabled: !!coin }
  )

  // Map chart period to days for CoinGecko API
  // IMPORTANT: Use unique decimal values to prevent cache collisions
  const daysMap: Record<typeof chartPeriod, number | string> = {
    '24h': 1,       // 24 hours
    '7d': 7,        // 1 week  
    '1m': 30,       // 1 month
    '3m': 90,       // 3 months
    '1y': 365,      // 1 year
    'max': 'max',   // All available data
  }

  // Get current days value
  const currentDays = daysMap[chartPeriod] as number | 'max'

  // Get price history with transactions
  // React Query will cache by { coinId, days } - when days changes, new query is made
  const { data: priceHistory, isLoading: priceHistoryLoading, dataUpdatedAt, isFetching } = trpc.markets.getPriceHistory.useQuery(
    { coinId, days: currentDays },
    { 
      enabled: !!coin && !!currentDays,
      staleTime: 60000, // Cache for 60 seconds to avoid rate limiting
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  )

  // Track when period changes to force component update
  const [lastPeriod, setLastPeriod] = useState(chartPeriod)
  
  useEffect(() => {
    if (lastPeriod !== chartPeriod) {
      setLastPeriod(chartPeriod)
      // Force re-render by updating state
    }
  }, [chartPeriod, lastPeriod])

  // Debug logging
  console.log('💼 Holdings Query:', {
    coinId,
    holdings,
    holdingsLoading,
    holdingsError,
    coinSymbol: coin?.symbol
  })

  // Force component re-render when period changes
  const chartKey = `${coinId}-${chartPeriod}-${chartType}`
  
  console.log('📈 Price History Query:', {
    coinId,
    period: chartPeriod,
    lastPeriod,
    currentDays,
    chartKey,
    queryInput: { coinId, days: currentDays },
    dataUpdatedAt: new Date(dataUpdatedAt).toLocaleTimeString(),
    isLoading: priceHistoryLoading,
    isFetching,
    hasCachedData: !!priceHistory,
    priceHistory,
    pricesCount: priceHistory?.prices?.length || 0,
    transactionsCount: priceHistory?.transactions?.length || 0,
    firstPrice: priceHistory?.prices?.[0],
    lastPrice: priceHistory?.prices?.[priceHistory?.prices?.length - 1]
  })

  const toggleWatchlist = trpc.markets.toggleWatchlist.useMutation({
    onSuccess: (data) => {
      toast.success(data.added ? 'Added to watchlist' : 'Removed from watchlist')
      utils.markets.getAll.invalidate()
    },
    onError: () => {
      toast.error('Failed to update watchlist')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="h-12 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!coin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Cryptocurrency not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/markets">Back to Markets</Link>
        </Button>
      </div>
    )
  }

  const isPositive = coin.priceChange24h >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/markets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Markets
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleWatchlist.mutate({ assetId: coin.id })}
            disabled={toggleWatchlist.isPending}
          >
            <Star
              className={cn(
                'w-4 h-4 mr-2',
                (coin as any).isWatchlisted &&
                  'fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500'
              )}
            />
            {(coin as any).isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
          </Button>

          <Button size="sm" asChild>
            <Link href={`/dashboard/transactions?asset=${coin.id}`}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Link>
          </Button>
        </div>
      </div>

      {/* Coin Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Icon */}
              {coin.iconUrl ? (
                <img 
                  src={coin.iconUrl} 
                  alt={coin.symbol}
                  className="w-16 h-16 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'block'
                  }}
                />
              ) : null}
              <div style={{ display: coin.iconUrl ? 'none' : 'block' }}>
                <CryptoIcon symbol={coin.symbol} size={64} />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{coin.name}</h1>
                  <span className="text-xl text-gray-500 dark:text-gray-400 font-mono">
                    {coin.symbol}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    #{coin.rank}
                  </span>
                </div>

                <div className="flex items-baseline gap-4 mt-2">
                  <span className="text-4xl font-bold">
                    {formatPrice(coin.currentPrice)}
                  </span>
                  <div className={cn(
                    'flex items-center gap-1 text-lg font-semibold',
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span>
                      {isPositive ? '+' : ''}
                      {coin.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMarketCap(coin.marketCap)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              24h Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMarketCap(coin.volume24h)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              1h Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold',
              coin.priceChange1h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {coin.priceChange1h >= 0 ? '+' : ''}
              {coin.priceChange1h.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              7d Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold',
              coin.priceChange7d >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {coin.priceChange7d >= 0 ? '+' : ''}
              {coin.priceChange7d.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Holdings Section */}
      {holdingsLoading ? (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <CardTitle>Your Holdings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-500 dark:text-gray-400 mt-3">Loading holdings...</p>
            </div>
          </CardContent>
        </Card>
      ) : holdings && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle>Your Holdings</CardTitle>
              </div>
              <Button size="sm" asChild>
                <Link href={`/dashboard/transactions?asset=${coinId}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              {/* Quantity */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <PieChart className="w-4 h-4" />
                  <span>Quantity</span>
                </div>
                <div className="text-2xl font-bold">
                  {holdings.totalQuantity.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 8,
                  })}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {coin.symbol}
                </div>
              </div>

              {/* Average Buy Price */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Avg Buy Price</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatPrice(holdings.avgBuyPrice)}
                </div>
                <div className={cn(
                  'text-sm font-medium mt-1',
                  coin.currentPrice >= holdings.avgBuyPrice
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {coin.currentPrice >= holdings.avgBuyPrice ? '▲' : '▼'}{' '}
                  {((coin.currentPrice - holdings.avgBuyPrice) / holdings.avgBuyPrice * 100).toFixed(2)}%
                </div>
              </div>

              {/* Current Value */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Wallet className="w-4 h-4" />
                  <span>Current Value</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatPrice(holdings.totalQuantity * coin.currentPrice)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Invested: {formatPrice(holdings.totalInvested)}
                </div>
              </div>

              {/* P&L */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Target className="w-4 h-4" />
                  <span>Profit/Loss</span>
                </div>
                <div className={cn(
                  'text-2xl font-bold',
                  (holdings.totalQuantity * coin.currentPrice - holdings.totalInvested) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {(holdings.totalQuantity * coin.currentPrice - holdings.totalInvested) >= 0 ? '+' : ''}
                  {formatPrice(holdings.totalQuantity * coin.currentPrice - holdings.totalInvested)}
                </div>
                <div className={cn(
                  'text-sm font-medium mt-1',
                  (holdings.totalQuantity * coin.currentPrice - holdings.totalInvested) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {((holdings.totalQuantity * coin.currentPrice - holdings.totalInvested) / holdings.totalInvested * 100).toFixed(2)}% ROI
                </div>
              </div>
            </div>

            {/* Portfolios List */}
            {holdings.portfolios.length > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Across {holdings.portfolios.length} portfolios:
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {holdings.portfolios.map((portfolio) => (
                    <div
                      key={portfolio.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{portfolio.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {portfolio.quantity.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 8,
                          })}{' '}
                          {coin.symbol}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatPrice(portfolio.quantity * coin.currentPrice)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Avg: {formatPrice(portfolio.avgBuyPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Price Chart</CardTitle>
          
          {/* Chart Controls - CoinGecko Style */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Chart Type Selector */}
            <div className="flex gap-2">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                className="h-8"
              >
                📈 Line
              </Button>
              <Button
                variant={chartType === 'candle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('candle')}
                className="h-8"
              >
                📊 Candle
              </Button>
            </div>

            {/* Period Selector */}
            <div className="flex gap-1">
              {(['24h', '7d', '1m', '3m', '1y', 'max'] as const).map((period) => (
                <Button
                  key={period}
                  variant={chartPeriod === period ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartPeriod(period)}
                  className="h-8 px-3 font-medium"
                >
                  {period.toUpperCase()}
                </Button>
              ))}
            </div>

            {/* Options */}
            <div className="flex gap-2">
              <Button
                variant={isLogScale ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsLogScale(!isLogScale)}
                className="h-8"
              >
                LOG
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(priceHistoryLoading || isFetching) && !priceHistory ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                <p className="text-sm text-gray-500">Loading {chartPeriod.toUpperCase()} data...</p>
              </div>
            </div>
          ) : priceHistory && priceHistory.prices.length > 0 ? (
            <PriceChartWithTransactions
              key={chartKey}
              priceData={priceHistory.prices}
              transactions={priceHistory.transactions}
              avgBuyPrice={holdings?.avgBuyPrice}
              symbol={coin.symbol}
              currentPrice={coin.currentPrice}
            />
          ) : coin.sparkline7d && coin.sparkline7d.length > 0 ? (
            <PriceChartWithTransactions
              key={chartKey}
              sparkline={coin.sparkline7d}
              transactions={priceHistory?.transactions || []}
              avgBuyPrice={holdings?.avgBuyPrice}
              symbol={coin.symbol}
              currentPrice={coin.currentPrice}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              Chart data not available
            </div>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About {coin.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Symbol</div>
                <div className="font-mono font-semibold">{coin.symbol}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rank</div>
                <div className="font-semibold">#{coin.rank}</div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`https://www.coingecko.com/en/coins/${coinId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on CoinGecko
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
