'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'
import { 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatPercentage, getPnLColor } from '@/lib/utils'

export default function DashboardPage() {
  const { data: portfolios, isLoading } = trpc.portfolios.list.useQuery()
  const { data: topAssets } = trpc.assets.list.useQuery()

  // Fetch positions and transactions for all portfolios
  const portfolioIds = portfolios?.map((p: any) => p.id) || []
  const positionsQueries = portfolioIds.map(id => 
    trpc.positions.list.useQuery({ portfolio_id: id }, { enabled: !!id })
  )
  const transactionsQueries = portfolioIds.map(id =>
    trpc.transactions.list.useQuery({ portfolio_id: id }, { enabled: !!id })
  )

  // Combine all transactions
  const allTransactions = transactionsQueries
    .flatMap(query => query.data || [])
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Calculate real stats from all portfolios
  let totalValue = 0
  let totalCost = 0

  positionsQueries.forEach(query => {
    if (query.data) {
      query.data.forEach((pos: any) => {
        const currentPrice = pos.assets?.current_price || 0
        totalValue += pos.quantity * currentPrice
        totalCost += pos.quantity * pos.avg_price
      })
    }
  })

  const totalPnL = totalValue - totalCost
  const pnlPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  const mockStats = {
    totalValue,
    totalPnL,
    pnlPercentage,
    portfolioCount: portfolios?.length || 0,
    dayChange: 0, // TODO: Calculate from 24h price changes
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Track your crypto portfolio performance</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/portfolios/new">
            <Plus className="w-4 h-4 mr-2" />
            New Portfolio
          </Link>
        </Button>
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
              <div className="space-y-3">
                {allTransactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      {tx.assets?.icon_url ? (
                        <img src={tx.assets.icon_url} alt={tx.assets.symbol} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                          {tx.assets?.symbol.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{tx.assets?.symbol}</div>
                        <div className="text-sm text-muted-foreground">{tx.type.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{tx.quantity} @ {formatCurrency(tx.price)}</div>
                      <div className="text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
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
          <div className="space-y-4">
            {topAssets?.slice(0, 5).map((asset: any) => (
              <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  {asset.icon_url ? (
                    <img 
                      src={asset.icon_url} 
                      alt={asset.symbol} 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold">
                      {asset.symbol[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums">{formatCurrency(asset.current_price || 0)}</p>
                  <p className={`text-sm font-medium flex items-center gap-1 ${getPnLColor(asset.price_change_24h || 0)}`}>
                    {(asset.price_change_24h || 0) >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {formatPercentage(Math.abs(asset.price_change_24h || 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
