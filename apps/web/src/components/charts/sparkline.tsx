'use client'

import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  color?: string
  className?: string
}

export function Sparkline({ data, color = '#8b5cf6', className }: SparklineProps) {
  if (!data || data.length === 0) return null

  const chartData = data.map((value, index) => ({
    value,
    index,
  }))

  const isPositive = data[data.length - 1] >= data[0]

  return (
    <div className={cn("w-full h-8", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={1.5}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
