'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface PriceDataPoint {
  id: number
  ts: string | Date
  price: number
}

interface PriceChartProps {
  data: PriceDataPoint[]
  height?: number
  showGrid?: boolean
}

export function PriceChart({ data, height = 400, showGrid = true }: PriceChartProps) {
  // Transform data for recharts
  const chartData = useMemo(() => {
    return data
      .map((point) => ({
        timestamp: new Date(point.ts).getTime(),
        date: format(new Date(point.ts), 'MMM dd'),
        price: point.price,
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [data])

  // Calculate if price is going up or down
  const isPositive = useMemo(() => {
    if (chartData.length < 2) return true
    const first = chartData[0].price
    const last = chartData[chartData.length - 1].price
    return last >= first
  }, [chartData])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No price data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.1)"
            vertical={false}
          />
        )}
        
        <XAxis
          dataKey="date"
          stroke="rgba(255, 255, 255, 0.5)"
          style={{ fontSize: '12px' }}
          tickLine={false}
          axisLine={false}
        />
        
        <YAxis
          stroke="rgba(255, 255, 255, 0.5)"
          style={{ fontSize: '12px' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          domain={['auto', 'auto']}
        />
        
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px',
          }}
          labelStyle={{
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '4px',
          }}
          itemStyle={{
            color: '#fff',
          }}
          formatter={(value: number) => [formatCurrency(value), 'Price']}
        />
        
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isPositive ? '#10b981' : '#ef4444'}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={isPositive ? '#10b981' : '#ef4444'}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        
        <Area
          type="monotone"
          dataKey="price"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth={2}
          fill="url(#colorPrice)"
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
