'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PercentBadgeProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
}

export function PercentBadge({ value, size = 'md' }: PercentBadgeProps) {
  const isPositive = value >= 0

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded font-semibold',
        sizeClasses[size],
        isPositive
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      )}
    >
      {isPositive ? (
        <TrendingUp className={iconSizes[size]} />
      ) : (
        <TrendingDown className={iconSizes[size]} />
      )}
      {isPositive ? '+' : ''}
      {value.toFixed(2)}%
    </div>
  )
}
