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

  // Mock data for demo (replace with real data later)
  const mockStats = {
    totalValue: 125430.50,
    totalPnL: 23450.75,
    pnlPercentage: 23.5,
    portfolioCount: portfolios?.length || 0,
    dayChange: 2.3,
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
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No recent transactions</p>
              <Button variant="outline" asChild>
                <Link href="/dashboard/transactions/new">Add Transaction</Link>
              </Button>
            </div>
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
            {/* Mock data - replace with real data */}
            {[
              { name: 'Bitcoin', symbol: 'BTC', change: 5.2, value: 45230 },
              { name: 'Ethereum', symbol: 'ETH', change: 3.8, value: 28450 },
              { name: 'Solana', symbol: 'SOL', change: -2.1, value: 12300 },
            ].map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold">
                    {asset.symbol[0]}
                  </div>
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums">{formatCurrency(asset.value)}</p>
                  <p className={`text-sm font-medium flex items-center gap-1 ${getPnLColor(asset.change)}`}>
                    {asset.change >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {formatPercentage(Math.abs(asset.change))}
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
