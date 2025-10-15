'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, DollarSign } from 'lucide-react'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'

interface PortfolioCardEnhancedProps {
  portfolio: {
    id: string
    name: string
    pnl_method: string
    base_currency: string
  }
  stats?: {
    totalValue: number
    totalPnL: number
    pnlPercent: number
    assetCount: number
  }
  index: number
}

const GRADIENT_COLORS = [
  'from-violet-500/20 to-purple-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-emerald-500/20 to-teal-500/20',
  'from-orange-500/20 to-red-500/20',
  'from-pink-500/20 to-rose-500/20',
]

const ICON_COLORS = [
  'text-violet-400',
  'text-blue-400',
  'text-emerald-400',
  'text-orange-400',
  'text-pink-400',
]

export function PortfolioCardEnhanced({ portfolio, stats, index }: PortfolioCardEnhancedProps) {
  const gradientClass = GRADIENT_COLORS[index % GRADIENT_COLORS.length]
  const iconColor = ICON_COLORS[index % ICON_COLORS.length]
  const isProfit = (stats?.totalPnL || 0) >= 0

  return (
    <Link href={`/dashboard/portfolios/${portfolio.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className={cn(
          "relative overflow-hidden rounded-xl border border-white/10",
          "bg-gradient-to-br",
          gradientClass,
          "backdrop-blur-sm",
          "transition-all duration-300",
          "hover:border-white/20 hover:shadow-xl hover:shadow-violet-500/10",
          "group cursor-pointer"
        )}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-white/5 backdrop-blur-sm",
                "group-hover:scale-110 transition-transform duration-300"
              )}>
                <Wallet className={cn("w-6 h-6", iconColor)} />
              </div>
              <div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {portfolio.name}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 font-mono">
                    {portfolio.pnl_method.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>{portfolio.base_currency}</span>
                </p>
              </div>
            </div>
            
            <ArrowUpRight className={cn(
              "w-5 h-5 text-muted-foreground",
              "group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1",
              "transition-all duration-300"
            )} />
          </div>

          {/* Stats */}
          {stats ? (
            <div className="space-y-3">
              {/* Total Value */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Portfolio Value</span>
                <span className="text-lg font-bold font-mono">
                  {formatCurrency(stats.totalValue)}
                </span>
              </div>

              {/* P&L */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total P&L</span>
                <div className="flex items-center gap-2">
                  {isProfit ? (
                    <TrendingUp className="w-4 h-4 text-profit" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-loss" />
                  )}
                  <span className={cn(
                    "text-sm font-semibold font-mono",
                    isProfit ? "text-profit" : "text-loss"
                  )}>
                    {formatCurrency(stats.totalPnL)}
                  </span>
                  <span className={cn(
                    "text-xs font-semibold",
                    isProfit ? "text-profit" : "text-loss"
                  )}>
                    ({formatPercentage(stats.pnlPercent)})
                  </span>
                </div>
              </div>

              {/* Asset Count */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Assets
                </span>
                <span className="text-xs font-semibold">
                  {stats.assetCount} {stats.assetCount === 1 ? 'asset' : 'assets'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-4 bg-white/5 rounded animate-pulse" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
            </div>
          )}
        </div>

        {/* Bottom gradient accent */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1",
          "bg-gradient-to-r",
          gradientClass.replace('/20', '/60'),
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        )} />
      </motion.div>
    </Link>
  )
}
