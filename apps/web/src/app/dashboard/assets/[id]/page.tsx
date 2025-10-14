'use client'

import { use } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  Wallet
} from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { PriceChart } from '@/components/charts/price-chart'

export default function AssetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const assetId = parseInt(id)
  
  const { data: asset, isLoading: assetLoading } = trpc.assets.getById.useQuery({ id: assetId })
  const { data: assetStats, isLoading: statsLoading } = trpc.assets.getStats.useQuery({ id: assetId })
  const { data: priceHistory, isLoading: historyLoading } = trpc.assets.getPriceHistory.useQuery({ 
    id: assetId,
    days: 30 
  })
  const { data: userTransactions, isLoading: txLoading } = trpc.assets.getUserTransactions.useQuery({ 
    id: assetId 
  })

  if (assetLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="h-12 w-64 bg-white/5 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 glass rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Asset not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const currentPrice = asset.current_price || 0
  const priceChange24h = asset.price_change_24h || 0
  const isPositive = priceChange24h >= 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-4">
            {asset.icon_url ? (
              <img 
                src={asset.icon_url} 
                alt={asset.symbol} 
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-2xl font-bold">{asset.symbol.slice(0, 2)}</span>
              </div>
            )}
            
            <div>
              <h1 className="text-4xl font-bold text-gradient">{asset.name}</h1>
              <p className="text-muted-foreground mt-1 text-lg">{asset.symbol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price Overview */}
      <Card className="glass-strong border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Price</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold tabular-nums">{formatCurrency(currentPrice)}</span>
                <div className={cn(
                  'flex items-center gap-1 text-lg font-semibold',
                  isPositive ? 'text-profit' : 'text-loss'
                )}>
                  {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span>{isPositive ? '+' : ''}{formatPercentage(priceChange24h)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">24h change</p>
            </div>

            {asset.market_cap && (
              <div className="flex gap-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatCurrency(asset.market_cap)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Holdings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatNumber(assetStats?.totalQuantity || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency((assetStats?.totalQuantity || 0) * currentPrice)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Buy Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(assetStats?.avgBuyPrice || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all portfolios
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {(assetStats?.totalPnL || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-profit" />
            ) : (
              <TrendingDown className="h-4 w-4 text-loss" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold tabular-nums',
              (assetStats?.totalPnL || 0) >= 0 ? 'text-profit' : 'text-loss'
            )}>
              {formatCurrency(assetStats?.totalPnL || 0)}
            </div>
            <p className={cn(
              'text-xs mt-1',
              (assetStats?.totalPnL || 0) >= 0 ? 'text-profit' : 'text-loss'
            )}>
              {(assetStats?.totalPnL || 0) >= 0 ? '+' : ''}{formatPercentage(assetStats?.pnlPercent || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {assetStats?.transactionCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="chart" className="space-y-6">
        <TabsList className="glass-strong">
          <TabsTrigger value="chart">
            <BarChart3 className="w-4 h-4 mr-2" />
            Price Chart
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Activity className="w-4 h-4 mr-2" />
            Your Transactions
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            Price History
          </TabsTrigger>
        </TabsList>

        {/* Price Chart Tab */}
        <TabsContent value="chart" className="space-y-4">
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle>30-Day Price Chart</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
                </div>
              ) : priceHistory && priceHistory.length > 0 ? (
                <div className="h-[400px]">
                  <PriceChart data={priceHistory} height={400} />
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No price history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle>Your Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : userTransactions && userTransactions.length > 0 ? (
                <div className="space-y-2">
                  {userTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' 
                            ? 'bg-profit/20 text-profit' 
                            : 'bg-loss/20 text-loss'
                        )}>
                          {tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{tx.type.toUpperCase()}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(tx.timestamp), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold tabular-nums">
                          {formatNumber(tx.quantity)} @ {formatCurrency(tx.price)}
                        </div>
                        <div className="text-sm text-muted-foreground tabular-nums">
                          Total: {formatCurrency(tx.quantity * tx.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No transactions for this asset yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle>Historical Price Data</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : priceHistory && priceHistory.length > 0 ? (
                <div className="space-y-2">
                  {priceHistory.slice(0, 10).map((tick: any, index: number) => {
                    const prevPrice = priceHistory[index + 1]?.price || tick.price
                    const change = ((tick.price - prevPrice) / prevPrice) * 100
                    const isPositive = change >= 0

                    return (
                      <div
                        key={tick.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div>
                          <div className="font-medium">
                            {format(new Date(tick.ts), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(tick.ts), 'HH:mm:ss')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold tabular-nums">
                            {formatCurrency(tick.price)}
                          </div>
                          {index < priceHistory.length - 1 && (
                            <div className={cn(
                              'text-sm tabular-nums',
                              isPositive ? 'text-profit' : 'text-loss'
                            )}>
                              {isPositive ? '+' : ''}{change.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No price history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
