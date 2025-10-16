'use client'

import { useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AssetAllocationChart } from '@/components/charts/asset-allocation-chart'
import { PnLChart } from '@/components/charts/pnl-chart'
import { formatCurrency, formatPercentage, formatNumber, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, PieChart, BarChart3, Activity, Target, Shield, Zap } from 'lucide-react'
import { Number } from '@/components/ui/number'

export default function AnalyticsPage() {
  const { data: positions, isLoading: positionsLoading } = trpc.positions.list.useQuery()
  const { data: portfolios } = trpc.portfolios.listWithStats.useQuery()

  // Calculate asset allocation
  const assetAllocation = useMemo(() => {
    if (!positions) return []

    const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0)
    
    return positions.map(pos => ({
      symbol: pos.asset.symbol,
      name: pos.asset.name,
      value: pos.currentValue,
      percentage: (pos.currentValue / totalValue) * 100,
    }))
  }, [positions])

  // Calculate portfolio metrics
  const metrics = useMemo(() => {
    if (!positions) return null

    const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0)
    const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0)
    const totalPnL = totalValue - totalCost
    const roi = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

    // Best and worst performers
    const sorted = [...positions].sort((a, b) => b.roi - a.roi)
    const bestPerformer = sorted[0]
    const worstPerformer = sorted[sorted.length - 1]

    // Calculate average holding time
    const avgHoldingDays = positions.reduce((sum, pos) => {
      const days = Math.floor((Date.now() - new Date(pos.firstPurchaseDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0) / positions.length

    // Win rate (positions with profit)
    const profitablePositions = positions.filter(pos => pos.unrealizedPnL > 0).length
    const winRate = (profitablePositions / positions.length) * 100

    // Diversification score (1-10)
    const diversificationScore = Math.min(10, Math.max(1, positions.length))

    // Risk score (based on volatility - simplified)
    // Higher allocation in volatile assets = higher risk
    const volatileAssets = ['BTC', 'ETH', 'SOL', 'DOGE', 'SHIB']
    const volatileAllocation = positions
      .filter(pos => volatileAssets.includes(pos.asset.symbol))
      .reduce((sum, pos) => sum + pos.currentValue, 0)
    const riskScore = Math.min(10, Math.max(1, (volatileAllocation / totalValue) * 10))

    return {
      totalValue,
      totalCost,
      totalPnL,
      roi,
      bestPerformer,
      worstPerformer,
      avgHoldingDays,
      winRate,
      diversificationScore,
      riskScore,
      assetCount: positions.length,
    }
  }, [positions])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient">Portfolio Analytics</h1>
        <p className="text-muted-foreground mt-2">Deep dive into your investment performance</p>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Value */}
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                <Number>{formatCurrency(metrics.totalValue)}</Number>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cost: {formatCurrency(metrics.totalCost)}
              </p>
            </CardContent>
          </Card>

          {/* ROI */}
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
              {metrics.roi >= 0 ? (
                <TrendingUp className="h-4 w-4 text-profit" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss" />
              )}
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold tabular-nums",
                metrics.roi >= 0 ? "text-profit" : "text-loss"
              )}>
                <Number>{formatPercentage(metrics.roi)}</Number>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(metrics.totalPnL)}
              </p>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                <Number>{formatPercentage(metrics.winRate)}</Number>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(metrics.winRate * metrics.assetCount / 100)} / {metrics.assetCount} profitable
              </p>
            </CardContent>
          </Card>

          {/* Avg Holding */}
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Holding</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {Math.round(metrics.avgHoldingDays)}d
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.avgHoldingDays > 180 ? 'Long-term holder' : 'Active trader'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Asset Allocation */}
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Asset Allocation
            </CardTitle>
            <CardDescription>
              Portfolio distribution by asset value
            </CardDescription>
          </CardHeader>
          <CardContent>
            {positionsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <AssetAllocationChart data={assetAllocation} />
            )}
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Over Time
            </CardTitle>
            <CardDescription>
              Portfolio value history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PnLChart />
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      {metrics && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Best Performer */}
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-profit" />
                Best Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.bestPerformer ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{metrics.bestPerformer.asset.symbol}</p>
                      <p className="text-sm text-muted-foreground">{metrics.bestPerformer.asset.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-profit">
                        +{formatPercentage(metrics.bestPerformer.roi)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(metrics.bestPerformer.unrealizedPnL)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-muted-foreground">Holdings</p>
                      <p className="font-mono">{formatNumber(metrics.bestPerformer.quantity)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="font-mono">{formatCurrency(metrics.bestPerformer.currentValue)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>

          {/* Worst Performer */}
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-loss" />
                Worst Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.worstPerformer ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{metrics.worstPerformer.asset.symbol}</p>
                      <p className="text-sm text-muted-foreground">{metrics.worstPerformer.asset.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-2xl font-bold",
                        metrics.worstPerformer.roi >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {metrics.worstPerformer.roi >= 0 ? '+' : ''}{formatPercentage(metrics.worstPerformer.roi)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(metrics.worstPerformer.unrealizedPnL)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-muted-foreground">Holdings</p>
                      <p className="font-mono">{formatNumber(metrics.worstPerformer.quantity)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="font-mono">{formatCurrency(metrics.worstPerformer.currentValue)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk & Diversification */}
      {metrics && (
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Risk & Diversification Analysis
            </CardTitle>
            <CardDescription>
              Portfolio health indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Diversification Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Diversification</p>
                  <p className="text-2xl font-bold">{metrics.diversificationScore}/10</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.diversificationScore * 10}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.diversificationScore >= 7 ? 'Well diversified' : 
                   metrics.diversificationScore >= 4 ? 'Moderately diversified' : 
                   'Consider diversifying'}
                </p>
              </div>

              {/* Risk Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Risk Level</p>
                  <p className="text-2xl font-bold">{metrics.riskScore.toFixed(1)}/10</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      metrics.riskScore >= 7 ? "bg-loss" :
                      metrics.riskScore >= 4 ? "bg-amber-500" :
                      "bg-profit"
                    )}
                    style={{ width: `${metrics.riskScore * 10}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.riskScore >= 7 ? 'High risk' : 
                   metrics.riskScore >= 4 ? 'Medium risk' : 
                   'Low risk'}
                </p>
              </div>

              {/* Asset Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Assets</p>
                  <p className="text-2xl font-bold">{metrics.assetCount}</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, metrics.assetCount * 10)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.assetCount >= 10 ? 'Highly diversified' : 
                   metrics.assetCount >= 5 ? 'Good variety' : 
                   'Consider adding more assets'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
