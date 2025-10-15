'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'

interface PnLDataPoint {
  date: string
  value: number
  pnl: number
  pnlPercent: number
}

interface PnLChartProps {
  data: PnLDataPoint[]
  isLoading?: boolean
  onTimeframeChange?: (timeframe: Timeframe) => void
  height?: number
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' },
]

export function PnLChart({ 
  data, 
  isLoading = false,
  onTimeframeChange,
  height = 400 
}: PnLChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M')

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe)
    onTimeframeChange?.(timeframe)
  }

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map((point) => ({
      date: format(parseISO(point.date), 'MMM dd'),
      fullDate: point.date,
      value: point.value,
      pnl: point.pnl,
      pnlPercent: point.pnlPercent,
    }))
  }, [data])

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        currentValue: 0,
        totalPnL: 0,
        pnlPercent: 0,
        isPositive: true,
        change: 0,
        changePercent: 0,
      }
    }

    const first = chartData[0]
    const last = chartData[chartData.length - 1]
    const change = last.value - first.value
    const changePercent = first.value > 0 ? (change / first.value) * 100 : 0

    return {
      currentValue: last.value,
      totalPnL: last.pnl,
      pnlPercent: last.pnlPercent,
      isPositive: last.pnl >= 0,
      change,
      changePercent,
    }
  }, [chartData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    const isProfit = data.pnl >= 0

    return (
      <div className="glass-strong border border-white/10 rounded-lg p-4 shadow-xl">
        <p className="text-sm text-muted-foreground mb-2">{data.fullDate}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Value:</span>
            <span className="text-sm font-semibold">{formatCurrency(data.value)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">P&L:</span>
            <span className={cn(
              "text-sm font-semibold flex items-center gap-1",
              isProfit ? "text-profit" : "text-loss"
            )}>
              {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatCurrency(data.pnl)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">ROI:</span>
            <span className={cn(
              "text-sm font-semibold",
              isProfit ? "text-profit" : "text-loss"
            )}>
              {formatPercentage(data.pnlPercent)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className="glass-strong border-white/10">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading chart...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="glass-strong border-white/10">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No portfolio data yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add transactions to see your performance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-strong border-white/10">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="mb-2">Portfolio Performance</CardTitle>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold font-mono">
                  {formatCurrency(stats.currentValue)}
                </p>
                <p className={cn(
                  "text-sm font-semibold flex items-center gap-1 mt-1",
                  stats.isPositive ? "text-profit" : "text-loss"
                )}>
                  {stats.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {formatCurrency(stats.totalPnL)} ({formatPercentage(stats.pnlPercent)})
                </p>
              </div>
            </div>
          </div>
          
          {/* Timeframe filters */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {TIMEFRAMES.map((tf) => (
              <Button
                key={tf.value}
                variant={selectedTimeframe === tf.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTimeframeChange(tf.value)}
                className={cn(
                  "text-xs px-3 py-1.5 h-auto",
                  selectedTimeframe === tf.value 
                    ? "bg-violet-500 hover:bg-violet-600" 
                    : "hover:bg-white/10"
                )}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={stats.isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity={0.4}
                />
                <stop
                  offset="50%"
                  stopColor={stats.isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={stats.isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
            
            <XAxis
              dataKey="date"
              stroke="rgba(255, 255, 255, 0.4)"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis
              stroke="rgba(255, 255, 255, 0.4)"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Zero line */}
            <ReferenceLine
              y={chartData[0]?.value || 0}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke={stats.isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={3}
              fill="url(#colorPnL)"
              animationDuration={500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
