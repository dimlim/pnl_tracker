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
  ReferenceLine,
  Scatter,
  ComposedChart,
} from 'recharts'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface PriceDataPoint {
  id: number
  ts: string | Date
  price: number
}

interface Transaction {
  id: number
  timestamp: string | Date
  type: string
  quantity: number
  price: number
}

interface PriceChartProps {
  data: PriceDataPoint[]
  transactions?: Transaction[]
  breakEvenPrice?: number
  height?: number
  showGrid?: boolean
}

export function PriceChart({ 
  data, 
  transactions = [], 
  breakEvenPrice,
  height = 400, 
  showGrid = true 
}: PriceChartProps) {
  // Transform data for recharts
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const sorted = data
      .map((point) => ({
        timestamp: new Date(point.ts).getTime(),
        date: format(new Date(point.ts), 'MMM dd HH:mm'),
        price: point.price,
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
    
    // If we have very few points, don't filter
    if (sorted.length <= 50) return sorted
    
    // Sample data to max 100 points for performance
    const step = Math.ceil(sorted.length / 100)
    return sorted.filter((_, index) => index % step === 0 || index === sorted.length - 1)
  }, [data])

  // Transform transactions to chart points
  const transactionPoints = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'buy' || tx.type === 'deposit' || tx.type === 'transfer_in')
      .map(tx => ({
        timestamp: new Date(tx.timestamp).getTime(),
        date: format(new Date(tx.timestamp), 'MMM dd'),
        price: tx.price,
        quantity: tx.quantity,
        type: tx.type,
      }))
  }, [transactions])

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
      <ComposedChart
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
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
          labelStyle={{
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '8px',
            fontWeight: 600,
          }}
          itemStyle={{
            color: '#10b981',
            fontWeight: 500,
          }}
          formatter={(value: number, name: string) => {
            if (name === 'Buy') {
              return [formatCurrency(value), 'Entry Price']
            }
            return [formatCurrency(value), 'Price']
          }}
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
        
        {/* Break-even line */}
        {breakEvenPrice && (
          <ReferenceLine
            y={breakEvenPrice}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Break-even: ${formatCurrency(breakEvenPrice)}`,
              fill: '#f59e0b',
              fontSize: 12,
              position: 'right',
            }}
          />
        )}
        
        <Area
          type="monotone"
          dataKey="price"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth={2.5}
          fill="url(#colorPrice)"
          animationDuration={300}
          isAnimationActive={chartData.length < 100}
        />
        
        {/* Transaction markers */}
        {transactionPoints.length > 0 && (
          <Scatter
            name="Buy"
            data={transactionPoints}
            dataKey="price"
            fill="#8b5cf6"
            stroke="#a78bfa"
            strokeWidth={2}
            shape="circle"
            r={7}
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
