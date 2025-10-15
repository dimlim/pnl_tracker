'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Download,
  Clock
} from 'lucide-react'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Sparkline } from '@/components/charts/sparkline'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface PortfolioCardUnifiedProps {
  portfolio: {
    id: string
    name: string
    pnl_method: string
    base_currency: string
    updated_at?: string
  }
  stats: {
    totalValue: number
    totalPnL: number
    pnlPercent: number
    assetCount: number
    dayChange?: number
    dayChangePercent?: number
  }
  topAssets?: Array<{
    symbol: string
    icon?: string
  }>
  sparklineData?: number[]
  index: number
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onExport?: () => void
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

export function PortfolioCardUnified({ 
  portfolio, 
  stats, 
  topAssets,
  sparklineData,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
}: PortfolioCardUnifiedProps) {
  const gradientClass = GRADIENT_COLORS[index % GRADIENT_COLORS.length]
  const iconColor = ICON_COLORS[index % ICON_COLORS.length]
  const isProfit = stats.totalPnL >= 0
  const isDayProfit = (stats.dayChange || 0) >= 0

  return (
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
        "group"
      )}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <Link href={`/dashboard/portfolios/${portfolio.id}`} className="flex items-center gap-3 flex-1">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-white/5 backdrop-blur-sm",
              "group-hover:scale-110 transition-transform duration-300"
            )}>
              <Wallet className={cn("w-6 h-6", iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                {portfolio.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="px-2 py-0.5 rounded-full bg-white/10 font-mono">
                  {portfolio.pnl_method.toUpperCase()}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 font-semibold">
                  {portfolio.base_currency}
                </span>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/portfolios/${portfolio.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
            
            {/* 3-dots menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Portfolio
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onExport && (
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {/* Total Value */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Portfolio Value</span>
            <span className="text-lg font-bold font-mono">
              {formatCurrency(stats.totalValue)}
            </span>
          </div>

          {/* 24h Change */}
          {stats.dayChange !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">24h Change</span>
              <div className="flex items-center gap-1">
                {isDayProfit ? (
                  <TrendingUp className="w-3 h-3 text-profit" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-loss" />
                )}
                <span className={cn(
                  "text-sm font-semibold font-mono",
                  isDayProfit ? "text-profit" : "text-loss"
                )}>
                  {formatCurrency(stats.dayChange)}
                </span>
                <span className={cn(
                  "text-xs",
                  isDayProfit ? "text-profit" : "text-loss"
                )}>
                  ({formatPercentage(stats.dayChangePercent || 0)})
                </span>
              </div>
            </div>
          )}

          {/* Total P&L */}
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

          {/* Assets */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {stats.assetCount} {stats.assetCount === 1 ? 'asset' : 'assets'}
              </span>
            </div>
            
            {/* Top Assets Icons */}
            {topAssets && topAssets.length > 0 && (
              <div className="flex -space-x-2">
                {topAssets.slice(0, 3).map((asset, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-white/10 border-2 border-background flex items-center justify-center text-xs font-semibold"
                    title={asset.symbol}
                  >
                    {asset.symbol.slice(0, 2)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">7-day trend</span>
              </div>
              <Sparkline data={sparklineData} />
            </div>
          )}

          {/* Last Updated */}
          {portfolio.updated_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <Clock className="w-3 h-3" />
              <span>Updated {formatDistanceToNow(new Date(portfolio.updated_at), { addSuffix: true })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom gradient accent */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1",
        "bg-gradient-to-r",
        gradientClass.replace('/20', '/60'),
        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      )} />
    </motion.div>
  )
}
