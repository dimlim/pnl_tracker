'use client'

import { useState } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Number } from '@/components/ui/number'
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog'
import { trpc } from '@/lib/trpc/client'
import { 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatPercentage, formatNumber, getPnLColor, cn } from '@/lib/utils'

export default function DashboardPage() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  
  const { data: portfolios, isLoading } = trpc.portfolios.list.useQuery()
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = trpc.dashboard.getStats.useQuery()

  console.log('[CLIENT] Dashboard Stats:', {
    data: dashboardStats,
    loading: statsLoading,
    error: statsError,
  })

  const mockStats = {
    totalValue: dashboardStats?.totalValue ?? 0,
    totalPnL: dashboardStats?.totalPnL ?? 0,
    pnlPercentage: dashboardStats?.pnlPercentage ?? 0,
    portfolioCount: dashboardStats?.portfolioCount ?? 0,
    dayChange: 0,
  }

  const allTransactions = dashboardStats?.recentTransactions ?? []
  const topPerformers = dashboardStats?.topPerformers ?? []

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-gradient">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Track your crypto portfolio performance</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsTransactionDialogOpen(true)} variant="outline">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
          <Button asChild>
            <Link href="/dashboard/portfolios">
              <Plus className="w-4 h-4 mr-2" />
              New Portfolio
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Value"
          value={formatCurrency(mockStats.totalValue)}
          change={`${mockStats.dayChange >= 0 ? '+' : ''}${mockStats.dayChange}% today`}
          changeType={mockStats.dayChange >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
          iconColor="text-violet-400"
        />
        
        <StatCard
          title="Total P&L"
          value={formatCurrency(mockStats.totalPnL)}
          change={formatPercentage(mockStats.pnlPercentage)}
          changeType={mockStats.totalPnL >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconColor={mockStats.totalPnL >= 0 ? 'text-profit' : 'text-loss'}
        />
        
        <StatCard
          title="Portfolios"
          value={mockStats.portfolioCount.toString()}
          icon={DollarSign}
          iconColor="text-blue-400"
        />
        
        <StatCard
          title="24h Change"
          value={formatPercentage(mockStats.dayChange)}
          changeType={mockStats.dayChange >= 0 ? 'positive' : 'negative'}
          icon={Activity}
          iconColor={mockStats.dayChange >= 0 ? 'text-profit' : 'text-loss'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Overview */}
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Portfolios</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/portfolios">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : portfolios && portfolios.length > 0 ? (
              <div className="space-y-3">
                {portfolios.slice(0, 5).map((portfolio) => (
                  <Link
                    key={portfolio.id}
                    href={`/dashboard/portfolios/${portfolio.id}`}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {portfolio.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {portfolio.pnl_method.toUpperCase()} • {portfolio.base_currency}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No portfolios yet</p>
                <Button asChild>
                  <Link href="/dashboard/portfolios/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Portfolio
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Activity</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/transactions">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allTransactions && allTransactions.length > 0 ? (
              <div className="space-y-2">
                {/* Column Headers */}
                <div className="flex items-center gap-3 px-3 pb-2 border-b border-white/5">
                  <div className="w-[60px]"></div>
                  <div className="min-w-[100px]"></div>
                  <div className="flex-1 grid grid-cols-4 gap-4 text-xs text-muted-foreground uppercase-label">
                    <div>Date</div>
                    <div>Quantity</div>
                    <div>Buy Price</div>
                    <div className="text-right">ROI</div>
                  </div>
                </div>

                {/* Transaction Rows */}
                {allTransactions.slice(0, 5).map((tx: any) => {
                  const currentPrice = tx.assets?.current_price || 0
                  const buyPrice = tx.price
                  const roi = ((currentPrice - buyPrice) / buyPrice) * 100
                  const isProfit = roi >= 0
                  const txDate = new Date(tx.timestamp)
                  
                  return (
                    <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-white/5">
                      <div className={cn("px-2 py-1 rounded text-xs font-semibold uppercase w-[60px] text-center", isProfit ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss")}>
                        {tx.type}
                      </div>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        {tx.assets?.icon_url ? (
                          <img src={tx.assets.icon_url} alt={tx.assets.symbol} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                            {tx.assets?.symbol.slice(0, 1)}
                          </div>
                        )}
                        <span className="font-medium text-sm">{tx.assets?.symbol}</span>
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                        <div className="font-medium text-muted-foreground">
                          {txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <Number className="font-medium">{formatNumber(tx.quantity)}</Number>
                        <Number className="font-medium">{formatCurrency(buyPrice)}</Number>
                        <Number className={cn("font-semibold text-right", isProfit ? "text-profit" : "text-loss")}>
                          {isProfit ? '+' : ''}{roi.toFixed(2)}%
                        </Number>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No recent transactions</p>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/portfolios">Go to Portfolios</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="glass-strong border-white/10">
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topPerformers && topPerformers.length > 0 ? (
              <>
                {/* Column Headers */}
                <div className="flex items-center gap-3 px-3 pb-2 border-b border-white/5">
                  <div className="w-[60px]"></div>
                  <div className="min-w-[100px]"></div>
                  <div className="flex-1 grid grid-cols-4 gap-4 text-xs text-muted-foreground uppercase-label">
                    <div>Quantity</div>
                    <div>Buy Price</div>
                    <div>Current Value</div>
                    <div className="text-right">ROI</div>
                  </div>
                </div>

                {/* Asset Rows */}
                {topPerformers.map((asset: any) => {
                  const isProfit = (asset.pnlPercent || 0) >= 0
                  
                  return (
                    <Link
                      key={asset.id}
                      href={`/dashboard/assets/${asset.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-white/5 group"
                    >
                      <div className={cn("px-2 py-1 rounded text-xs font-semibold uppercase w-[60px] text-center", isProfit ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss")}>
                        {isProfit ? 'Profit' : 'Loss'}
                      </div>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        {asset.icon_url ? (
                          <img 
                            src={asset.icon_url} 
                            alt={asset.symbol} 
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                            {asset.symbol[0]}
                          </div>
                        )}
                        <span className="font-medium text-sm">{asset.symbol}</span>
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                        <Number className="font-medium">{formatNumber(asset.quantity || 0)}</Number>
                        <Number className="font-medium">{formatCurrency(asset.avgBuyPrice || 0)}</Number>
                        <Number className="font-medium">{formatCurrency(asset.value || 0)}</Number>
                        <Number className={cn("font-semibold text-right", isProfit ? "text-profit" : "text-loss")}>
                          {isProfit ? '+' : ''}{(asset.pnlPercent || 0).toFixed(2)}%
                        </Number>
                      </div>
                    </Link>
                  )
                })}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No assets in your portfolios yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog 
        open={isTransactionDialogOpen} 
        onOpenChange={setIsTransactionDialogOpen}
      />
    </div>
  )
}
