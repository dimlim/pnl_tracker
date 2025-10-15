'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
  ComposedChart,
  Scatter,
} from 'recharts'
import { format } from 'date-fns'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'
type Benchmark = 'BTC' | 'ETH' | 'NONE'

interface PnLDataPoint {
  t: number
  date: string
  value: number
  invested: number
  pnl: number
  realized: number
  unrealized: number
  pnlPercent: number
}

interface PnLChartProProps {
  data: PnLDataPoint[]
  isLoading?: boolean
  onTimeframeChange?: (timeframe: Timeframe) => void
  onBenchmarkChange?: (benchmark: Benchmark) => void
  height?: number
  transactions?: Array<{ timestamp: string; type: string; value: number }>
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' },
]

const BENCHMARKS: { value: Benchmark; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'BTC', label: 'vs BTC' },
  { value: 'ETH', label: 'vs ETH' },
]

export function PnLChartPro({ 
  data, 
  isLoading = false,
  onTimeframeChange,
  onBenchmarkChange,
  height = 400,
  transactions = [],
}: PnLChartProProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M')
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark>('NONE')
  const [showBrush, setShowBrush] = useState(false)

  const handleTimeframeChange = useCallback((timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe)
    onTimeframeChange?.(timeframe)
  }, [onTimeframeChange])

  const handleBenchmarkChange = useCallback((benchmark: Benchmark) => {
    setSelectedBenchmark(benchmark)
    onBenchmarkChange?.(benchmark)
  }, [onBenchmarkChange])

  // Transform data for chart with memoization
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      console.log('[PnLChartPro] No data:', data)
      return []
    }
    
    console.log('[PnLChartPro] Raw data:', data)
    
    const transformed = data.map((point) => ({
      ...point,
      dateFormatted: format(new Date(point.t), 'MMM dd'),
      timeFormatted: format(new Date(point.t), 'HH:mm'),
    }))
    
    console.log('[PnLChartPro] Transformed data:', transformed)
    return transformed
  }, [data])

  // Calculate stats with memoization
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        currentValue: 0,
        totalPnL: 0,
        pnlPercent: 0,
        isPositive: true,
        change: 0,
        changePercent: 0,
        invested: 0,
        realized: 0,
        unrealized: 0,
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
      invested: last.invested,
      realized: last.realized,
      unrealized: last.unrealized,
    }
  }, [chartData])

  // Transaction markers
  const transactionMarkers = useMemo(() => {
    return transactions.map(tx => ({
      t: new Date(tx.timestamp).getTime(),
      value: tx.value,
      type: tx.type,
    }))
  }, [transactions])

  // Custom tooltip with all details
  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    const isProfit = data.pnl >= 0

    return (
      <div className="glass-strong border border-white/20 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-white/10">
          <p className="text-sm font-medium">{data.dateFormatted}</p>
          <p className="text-xs text-muted-foreground">{data.timeFormatted}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs text-muted-foreground">Portfolio Value</span>
            <span className="text-sm font-bold font-mono">{formatCurrency(data.value)}</span>
          </div>
          
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs text-muted-foreground">Invested</span>
            <span className="text-sm font-mono text-muted-foreground">{formatCurrency(data.invested)}</span>
          </div>
          
          <div className="h-px bg-white/10 my-2" />
          
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs text-muted-foreground">Total P&L</span>
            <span className={cn(
              "text-sm font-bold font-mono flex items-center gap-1",
              isProfit ? "text-profit" : "text-loss"
            )}>
              {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatCurrency(data.pnl)}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs text-muted-foreground">ROI</span>
            <span className={cn(
              "text-sm font-bold font-mono",
              isProfit ? "text-profit" : "text-loss"
            )}>
              {formatPercentage(data.pnlPercent)}
            </span>
          </div>
          
          <div className="h-px bg-white/10 my-2" />
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Unrealized</span>
              <span className={cn(
                "font-mono font-semibold",
                data.unrealized >= 0 ? "text-profit" : "text-loss"
              )}>
                {formatCurrency(data.unrealized)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Realized</span>
              <span className="font-mono font-semibold text-muted-foreground">
                {formatCurrency(data.realized)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }, [])

  if (isLoading) {
    return (
      <Card className="glass-strong border-white/10">
        <CardHeader className="pb-4">
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
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
        <CardContent className="pt-6">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No portfolio data yet</p>
              <p className="text-sm text-muted-foreground mt-2 opacity-60">
                Add transactions to see your performance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-strong border-white/10 overflow-hidden">
      {/* Sticky Summary Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-bold font-mono tracking-tight">
                  {formatCurrency(stats.currentValue)}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={cn(
                    "text-sm font-semibold flex items-center gap-1",
                    stats.isPositive ? "text-profit" : "text-loss"
                  )}>
                    {stats.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {formatCurrency(stats.totalPnL)}
                  </span>
                  <span className={cn(
                    "text-sm font-semibold",
                    stats.isPositive ? "text-profit" : "text-loss"
                  )}>
                    {formatPercentage(stats.pnlPercent)}
                  </span>
                  {selectedBenchmark !== 'NONE' && (
                    <span className="text-sm text-muted-foreground">
                      • vs {selectedBenchmark} +25%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Benchmark selector */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {BENCHMARKS.map((bm) => (
                  <Button
                    key={bm.value}
                    variant={selectedBenchmark === bm.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleBenchmarkChange(bm.value)}
                    className={cn(
                      "text-xs px-3 py-1.5 h-auto",
                      selectedBenchmark === bm.value 
                        ? "bg-violet-500 hover:bg-violet-600" 
                        : "hover:bg-white/10"
                    )}
                  >
                    {bm.label}
                  </Button>
                ))}
              </div>
              
              {/* Timeframe selector */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {TIMEFRAMES.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={selectedTimeframe === tf.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleTimeframeChange(tf.value)}
                    className={cn(
                      "text-xs px-3 py-1.5 h-auto font-semibold",
                      selectedTimeframe === tf.value 
                        ? "bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/50" 
                        : "hover:bg-white/10"
                    )}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: showBrush ? 60 : 0 }}
          >
            <defs>
              {/* Gradient for profit */}
              <linearGradient id="colorPnLProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              
              {/* Gradient for loss */}
              <linearGradient id="colorPnLLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.03)"
              vertical={false}
            />
            
            <XAxis
              dataKey="dateFormatted"
              stroke="rgba(255, 255, 255, 0.3)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            
            <YAxis
              stroke="rgba(255, 255, 255, 0.3)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                return `$${value}`
              }}
              domain={['auto', 'auto']}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Invested baseline */}
            <Line
              type="monotone"
              dataKey="invested"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={chartData.length < 100}
              animationDuration={500}
            />
            
            {/* Main portfolio value area */}
            <Area
              type="monotone"
              dataKey="value"
              stroke={stats.isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2.5}
              fill={stats.isPositive ? 'url(#colorPnLProfit)' : 'url(#colorPnLLoss)'}
              isAnimationActive={chartData.length < 100}
              animationDuration={500}
              animationEasing="ease-in-out"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.3))',
              }}
            />
            
            {/* Transaction markers */}
            {transactionMarkers.length > 0 && transactionMarkers.length < 50 && (
              <Scatter
                data={transactionMarkers}
                dataKey="value"
                fill="#8b5cf6"
                stroke="#a78bfa"
                strokeWidth={2}
                shape="circle"
                r={5}
                isAnimationActive={false}
              />
            )}
            
            {/* Brush for zoom/pan */}
            {showBrush && chartData.length > 20 && (
              <Brush
                dataKey="dateFormatted"
                height={30}
                stroke="rgba(139, 92, 246, 0.5)"
                fill="rgba(0, 0, 0, 0.3)"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Toggle brush button */}
        {chartData.length > 20 && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBrush(!showBrush)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showBrush ? 'Hide' : 'Show'} Zoom Controls
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
