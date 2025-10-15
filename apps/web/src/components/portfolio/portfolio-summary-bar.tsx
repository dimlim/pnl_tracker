'use client'

import { TrendingUp, TrendingDown, Wallet, DollarSign, Activity } from 'lucide-react'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface PortfolioSummaryBarProps {
  totalValue: number
  totalPnL: number
  pnlPercent: number
  portfolioCount: number
  dayChange: number
  dayChangePercent: number
}

export function PortfolioSummaryBar({
  totalValue,
  totalPnL,
  pnlPercent,
  portfolioCount,
  dayChange,
  dayChangePercent,
}: PortfolioSummaryBarProps) {
  const isProfit = totalPnL >= 0
  const isDayProfit = dayChange >= 0

  const stats = [
    {
      label: 'Total Value',
      value: formatCurrency(totalValue),
      icon: Wallet,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'Total P&L',
      value: formatCurrency(totalPnL),
      subValue: `(${formatPercentage(pnlPercent)})`,
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? 'text-profit' : 'text-loss',
      bgColor: isProfit ? 'bg-profit/10' : 'bg-loss/10',
    },
    {
      label: 'Portfolios',
      value: portfolioCount.toString(),
      icon: DollarSign,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: '24h Change',
      value: formatCurrency(dayChange),
      subValue: `(${formatPercentage(dayChangePercent)})`,
      icon: isDayProfit ? TrendingUp : TrendingDown,
      color: isDayProfit ? 'text-profit' : 'text-loss',
      bgColor: isDayProfit ? 'bg-profit/10' : 'bg-loss/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-strong border-white/10 rounded-xl p-6 hover:scale-105 transition-transform duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono">{stat.value}</p>
                {stat.subValue && (
                  <p className={cn("text-sm font-semibold", stat.color)}>
                    {stat.subValue}
                  </p>
                )}
              </div>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              stat.bgColor
            )}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
