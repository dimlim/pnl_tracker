'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface AssetAllocationChartProps {
  data: Array<{
    symbol: string
    name: string
    value: number
    percentage: number
  }>
  className?: string
}

const COLORS = [
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // violet (repeat)
  '#ec4899', // pink (repeat)
]

export function AssetAllocationChart({ data, className }: AssetAllocationChartProps) {
  const chartData = useMemo(() => {
    // Sort by value descending
    const sorted = [...data].sort((a, b) => b.value - a.value)
    
    // Take top 7, group rest as "Others"
    if (sorted.length > 7) {
      const top7 = sorted.slice(0, 7)
      const others = sorted.slice(7)
      const othersValue = others.reduce((sum, item) => sum + item.value, 0)
      const othersPercentage = others.reduce((sum, item) => sum + item.percentage, 0)
      
      return [
        ...top7,
        {
          symbol: 'OTHERS',
          name: 'Others',
          value: othersValue,
          percentage: othersPercentage,
        }
      ]
    }
    
    return sorted
  }, [data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground mb-1">{data.symbol}</p>
          <p className="text-sm font-mono">{formatCurrency(data.value)}</p>
          <p className="text-xs text-primary font-semibold">{formatPercentage(data.percentage)}</p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    // Only show label if percentage > 5%
    if (percent < 0.05) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{entry.payload.symbol}</p>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(entry.payload.percentage)}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
