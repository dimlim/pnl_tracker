'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, ArrowRight } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

interface PortfolioCardProps {
  portfolio: {
    id: string
    name: string
    base_currency: string
    pnl_method: string
  }
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const { data: positions } = trpc.positions.list.useQuery({ portfolio_id: portfolio.id })

  // Calculate totals
  const totalValue = positions?.reduce((sum, pos) => {
    const currentPrice = pos.assets?.current_price || 0
    return sum + (pos.quantity * currentPrice)
  }, 0) || 0

  const totalCost = positions?.reduce((sum, pos) => {
    return sum + (pos.avg_price * pos.quantity)
  }, 0) || 0

  const totalPnL = totalValue - totalCost
  const isProfitable = totalPnL >= 0

  // Get unique assets with icons
  const uniqueAssets = positions?.slice(0, 5) || []

  return (
    <Link href={`/dashboard/portfolios/${portfolio.id}`}>
      <Card className="glass-strong border-white/10 hover:border-white/20 hover:scale-105 transition-all h-full group">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <CardTitle className="mt-4">{portfolio.name}</CardTitle>
          <CardDescription>
            {portfolio.pnl_method.toUpperCase()} • {portfolio.base_currency}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="font-semibold tabular-nums">{formatCurrency(totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">P&L</span>
              <span className={cn(
                'font-semibold tabular-nums',
                isProfitable ? 'text-profit' : 'text-loss'
              )}>
                {isProfitable ? '+' : ''}{formatCurrency(totalPnL)}
              </span>
            </div>
          </div>

          {/* Assets Icons */}
          {uniqueAssets.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Assets:</span>
                <div className="flex -space-x-2">
                  {uniqueAssets.map((position) => (
                    <div
                      key={position.id}
                      className="relative group/icon"
                      title={position.assets?.symbol}
                    >
                      {position.assets?.icon_url ? (
                        <img
                          src={position.assets.icon_url}
                          alt={position.assets.symbol}
                          className="w-6 h-6 rounded-full border-2 border-background"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold border-2 border-background">
                          {position.assets?.symbol.slice(0, 1)}
                        </div>
                      )}
                    </div>
                  ))}
                  {positions && positions.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium border-2 border-background">
                      +{positions.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
