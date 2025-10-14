'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  PieChart
} from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { PriceChart } from '@/components/charts/price-chart'
import { SeedPricesButton } from '@/components/admin/seed-prices-button'
import { TransactionFilters, type FilterState } from '@/components/transactions/transaction-filters'
import { exportTransactionsToExcel } from '@/lib/export'
import { AddAssetTransactionDialog } from '@/components/transactions/add-asset-transaction-dialog'
import { EditTransactionDialog } from '@/components/transactions/edit-transaction-dialog'

export default function AssetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const assetId = parseInt(id)
  const [chartPeriod, setChartPeriod] = useState<'1h' | '4h' | '24h' | '7d' | '30d' | 'all'>('24h')
  const [filters, setFilters] = useState<FilterState>({ type: [] })
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  
  const { data: asset, isLoading: assetLoading } = trpc.assets.getById.useQuery({ id: assetId })
  const { data: assetStats, isLoading: statsLoading } = trpc.assets.getStats.useQuery({ id: assetId })
  
  const utils = trpc.useUtils()
  const bulkDeleteMutation = trpc.transactions.bulkDelete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate()
      utils.assets.getUserTransactions.invalidate()
      utils.assets.getStats.invalidate()
      setSelectedTransactions([])
      setIsSelectionMode(false)
    },
  })
  
  const periodToDays: Record<typeof chartPeriod, number> = {
    '1h': 1,
    '4h': 1,
    '24h': 1,
    '7d': 7,
    '30d': 30,
    'all': 365,
  }
  
  const { data: priceHistory, isLoading: historyLoading } = trpc.assets.getPriceHistory.useQuery({ 
    id: assetId,
    days: periodToDays[chartPeriod]
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
  
  const realizedPnL = assetStats?.realizedPnL || 0
  const unrealizedPnL = assetStats?.unrealizedPnL || 0
  const breakEvenPrice = assetStats?.breakEvenPrice || 0
  const athPrice = assetStats?.athPrice || 0
  const distanceToATH = assetStats?.distanceToATH || 0
  const positionSize = assetStats?.positionSize || 0
  const totalPortfolioValue = assetStats?.totalPortfolioValue || 0
  
  // Filter transactions
  const filteredTransactions = userTransactions?.filter(tx => {
    // Type filter
    if (filters.type.length > 0 && !filters.type.includes(tx.type)) {
      return false
    }
    
    // Date filter
    if (filters.dateFrom && new Date(tx.timestamp) < filters.dateFrom) {
      return false
    }
    if (filters.dateTo && new Date(tx.timestamp) > filters.dateTo) {
      return false
    }
    
    // Amount filter
    const amount = tx.quantity * tx.price
    if (filters.minAmount !== undefined && amount < filters.minAmount) {
      return false
    }
    if (filters.maxAmount !== undefined && amount > filters.maxAmount) {
      return false
    }
    
    return true
  }) || []

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
        
        <AddAssetTransactionDialog assetId={assetId} assetSymbol={asset.symbol} />
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
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-profit" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold tabular-nums',
              (assetStats?.totalPnL || 0) >= 0 ? 'text-profit' : 'text-loss'
            )}>
              {(assetStats?.totalPnL || 0) >= 0 ? '+' : ''}{formatCurrency(assetStats?.totalPnL || 0)}
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              <div>
                <span className="text-muted-foreground">Realized: </span>
                <span className={cn(
                  'font-semibold tabular-nums',
                  realizedPnL >= 0 ? 'text-profit' : 'text-loss'
                )}>
                  {realizedPnL >= 0 ? '+' : ''}{formatCurrency(realizedPnL)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Unrealized: </span>
                <span className={cn(
                  'font-semibold tabular-nums',
                  unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'
                )}>
                  {unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(unrealizedPnL)}
                </span>
              </div>
            </div>
            <p className={cn(
              'text-sm tabular-nums mt-1',
              (assetStats?.pnlPercent || 0) >= 0 ? 'text-profit' : 'text-loss'
            )}>
              {(assetStats?.pnlPercent || 0) >= 0 ? '+' : ''}{(assetStats?.pnlPercent || 0).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {breakEvenPrice > 0 && (
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Break-Even Price</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-amber-500">
                {formatCurrency(breakEvenPrice)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPrice > breakEvenPrice 
                  ? `${formatCurrency(currentPrice - breakEvenPrice)} above break-even`
                  : `${formatCurrency(breakEvenPrice - currentPrice)} to break-even`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {athPrice > 0 && (
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Distance to ATH</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-purple-500">
                {distanceToATH.toFixed(2)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ATH: {formatCurrency(athPrice)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {distanceToATH < 0 
                  ? `${Math.abs(distanceToATH).toFixed(2)}% below ATH`
                  : 'At all-time high! 🎉'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {(assetStats?.avgHoldingDays || 0) > 0 && (
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Holding Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-blue-500">
                {assetStats?.avgHoldingDays || 0} days
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {assetStats?.avgHoldingDays && assetStats.avgHoldingDays > 30
                  ? `~${Math.floor(assetStats.avgHoldingDays / 30)} months`
                  : 'Short-term hold'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {positionSize > 0 && (
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-500" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Position Size</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-emerald-500">
                {positionSize.toFixed(2)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                of total portfolio
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {positionSize > 20 
                  ? '⚠️ High concentration'
                  : positionSize > 10
                  ? '✓ Moderate allocation'
                  : '✓ Well diversified'
                }
              </p>
            </CardContent>
          </Card>
        )}

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
        </TabsList>

        {/* Price Chart Tab */}
        <TabsContent value="chart" className="space-y-4">
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Price Chart</CardTitle>
                <div className="flex items-center gap-2">
                  {(!priceHistory || priceHistory.length === 0) && (
                    <SeedPricesButton assetId={assetId} />
                  )}
                  <div className="flex gap-1 glass p-1 rounded-lg">
                    {(['1h', '4h', '24h', '7d', '30d', 'all'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setChartPeriod(period)}
                        className={cn(
                          'px-3 py-1.5 rounded text-sm font-medium transition-all',
                          chartPeriod === period
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-white/10 text-muted-foreground'
                        )}
                      >
                        {period === 'all' ? 'All' : period.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
                </div>
              ) : priceHistory && priceHistory.length > 0 ? (
                <div className="h-[400px]">
                  <PriceChart 
                    data={priceHistory} 
                    transactions={userTransactions || []} 
                    breakEvenPrice={breakEvenPrice}
                    height={400} 
                  />
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                  <p className="text-muted-foreground">No price history available</p>
                  <p className="text-sm text-muted-foreground">Click the button above to seed test data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <TransactionFilters
            onFilterChange={setFilters}
            onExport={() => {
              if (userTransactions) {
                exportTransactionsToExcel(userTransactions, `${asset.symbol}-transactions.csv`)
              }
            }}
          />
          
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Transaction History</CardTitle>
              <div className="flex gap-2">
                {!isSelectionMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelectionMode(true)}
                  >
                    Select
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsSelectionMode(false)
                        setSelectedTransactions([])
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (filteredTransactions) {
                          const allIds = filteredTransactions.map((tx: any) => tx.id)
                          setSelectedTransactions(allIds)
                        }
                      }}
                    >
                      Select All
                    </Button>
                    {selectedTransactions.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Delete ${selectedTransactions.length} transaction(s)? This action cannot be undone.`)) {
                            bulkDeleteMutation.mutate({ ids: selectedTransactions })
                          }
                        }}
                        disabled={bulkDeleteMutation.isPending}
                      >
                        {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete (${selectedTransactions.length})`}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredTransactions && filteredTransactions.length > 0 ? (
                <div className="space-y-2">
                  {filteredTransactions.map((tx: any) => {
                    const txValue = tx.quantity * tx.price
                    const currentValue = tx.quantity * currentPrice
                    const pnl = currentValue - txValue
                    const pnlPercent = (pnl / txValue) * 100
                    const isProfitable = pnl >= 0
                    const isBuy = tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop'
                    
                    // Calculate days held
                    const txDate = new Date(tx.timestamp)
                    const now = new Date()
                    const daysHeld = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))
                    
                    // Calculate ROI
                    const roi = isBuy ? pnlPercent : 0
                    
                    return (
                      <div
                        key={tx.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors border",
                          selectedTransactions.includes(tx.id) ? "border-primary bg-primary/5" : "border-white/5"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          {isSelectionMode && (
                            <Checkbox
                              checked={selectedTransactions.includes(tx.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTransactions([...selectedTransactions, tx.id])
                                } else {
                                  setSelectedTransactions(selectedTransactions.filter(id => id !== tx.id))
                                }
                              }}
                            />
                          )}
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            isBuy ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'
                          )}>
                            {isBuy ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <TrendingDown className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium uppercase text-sm">{tx.type}</div>
                              {isBuy && (
                                <div className={cn(
                                  'px-2 py-0.5 rounded text-xs font-medium',
                                  isProfitable ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'
                                )}>
                                  {isProfitable ? '🟢' : '🔴'} {isProfitable ? 'Profit' : 'Loss'}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(tx.timestamp), 'MMM dd, yyyy HH:mm')} · {daysHeld}d held
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                            <div className="font-semibold tabular-nums">
                              {formatNumber(tx.quantity)}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Buy Price</div>
                            <div className="font-semibold tabular-nums">
                              {formatCurrency(tx.price)}
                            </div>
                          </div>
                          
                          {isBuy && (
                            <>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground mb-1">Current Value</div>
                                <div className="font-semibold tabular-nums">
                                  {formatCurrency(currentValue)}
                                </div>
                              </div>
                              
                              <div className="text-right min-w-[100px]">
                                <div className="text-xs text-muted-foreground mb-1">ROI</div>
                                <div className={cn(
                                  'font-semibold tabular-nums flex items-center justify-end gap-1',
                                  isProfitable ? 'text-profit' : 'text-loss'
                                )}>
                                  {isProfitable ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                  ) : (
                                    <ArrowDownRight className="w-3 h-3" />
                                  )}
                                  <span>{isProfitable ? '+' : ''}{roi.toFixed(2)}%</span>
                                </div>
                                <div className={cn(
                                  'text-xs tabular-nums',
                                  isProfitable ? 'text-profit' : 'text-loss'
                                )}>
                                  {isProfitable ? '+' : ''}{formatCurrency(pnl)}
                                </div>
                              </div>
                            </>
                          )}
                          
                          {!isBuy && (
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground mb-1">Total</div>
                              <div className="font-semibold tabular-nums">
                                {formatCurrency(txValue)}
                              </div>
                            </div>
                          )}
                          
                          <EditTransactionDialog transaction={tx} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : userTransactions && userTransactions.length > 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No transactions match your filters</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ type: [] })}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
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
      </Tabs>
    </div>
  )
}
