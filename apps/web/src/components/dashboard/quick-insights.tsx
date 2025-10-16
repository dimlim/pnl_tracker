'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Trophy, Calendar, Zap, Target } from 'lucide-react'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'
import { format } from 'date-fns'

interface QuickInsightsProps {
  portfolios?: any[]
  transactions?: any[]
  history?: any[]
}

export function QuickInsights({ portfolios, transactions, history }: QuickInsightsProps) {
  const insights = useMemo(() => {
    if (!portfolios || !transactions) return []

    const results = []

    // 1. Best performing asset
    const allPositions = portfolios.flatMap(p => p.positions || [])
    if (allPositions.length > 0) {
      const bestAsset = allPositions.reduce((best, current) => 
        (current.roi || 0) > (best.roi || 0) ? current : best
      )
      
      if (bestAsset && bestAsset.roi > 0) {
        results.push({
          icon: Trophy,
          iconColor: 'text-yellow-500',
          title: 'Top Performer',
          description: `${bestAsset.asset?.symbol || 'Asset'} is up ${formatPercentage(bestAsset.roi)}`,
          type: 'positive' as const,
        })
      }
    }

    // 2. Best day (from history)
    if (history && history.length > 1) {
      let bestDay = { date: '', gain: 0 }
      for (let i = 1; i < history.length; i++) {
        const gain = history[i].value - history[i - 1].value
        if (gain > bestDay.gain) {
          bestDay = { date: history[i].date, gain }
        }
      }
      
      if (bestDay.gain > 0) {
        results.push({
          icon: Calendar,
          iconColor: 'text-emerald-500',
          title: 'Best Day',
          description: `${formatCurrency(bestDay.gain)} gain on ${format(new Date(bestDay.date), 'MMM d')}`,
          type: 'positive' as const,
        })
      }
    }

    // 3. Recent activity
    if (transactions.length > 0) {
      const recentTx = transactions[0]
      const daysAgo = Math.floor((Date.now() - new Date(recentTx.timestamp).getTime()) / (1000 * 60 * 60 * 24))
      
      results.push({
        icon: Zap,
        iconColor: 'text-violet-500',
        title: 'Recent Activity',
        description: daysAgo === 0 
          ? 'Transaction added today'
          : `Last transaction ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`,
        type: 'neutral' as const,
      })
    }

    // 4. Portfolio diversity
    const uniqueAssets = new Set(allPositions.map(p => p.asset_id)).size
    if (uniqueAssets > 0) {
      results.push({
        icon: Target,
        iconColor: 'text-cyan-500',
        title: 'Diversification',
        description: uniqueAssets === 1 
          ? 'Consider diversifying your portfolio'
          : `${uniqueAssets} different assets`,
        type: uniqueAssets >= 5 ? 'positive' as const : 'neutral' as const,
      })
    }

    // 5. Overall performance
    const totalValue = portfolios.reduce((sum, p) => sum + (p.totalValue || 0), 0)
    const totalCost = portfolios.reduce((sum, p) => sum + (p.totalCost || 0), 0)
    const totalROI = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0
    
    if (totalROI !== 0) {
      results.push({
        icon: totalROI > 0 ? TrendingUp : TrendingDown,
        iconColor: totalROI > 0 ? 'text-profit' : 'text-loss',
        title: 'Overall Performance',
        description: `Portfolio ${totalROI > 0 ? 'up' : 'down'} ${formatPercentage(Math.abs(totalROI))}`,
        type: totalROI > 0 ? 'positive' as const : 'negative' as const,
      })
    }

    return results.slice(0, 4) // Show max 4 insights
  }, [portfolios, transactions, history])

  if (insights.length === 0) return null

  return (
    <Card className="glass-strong border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-500" />
          Quick Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                'hover:bg-white/5',
                insight.type === 'positive' && 'bg-profit/5',
                insight.type === 'negative' && 'bg-loss/5'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                'bg-white/5',
                insight.iconColor
              )}>
                <insight.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1">{insight.title}</p>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
