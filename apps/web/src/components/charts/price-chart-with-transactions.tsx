'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Line,
} from 'recharts'
import { format } from 'date-fns'

interface Transaction {
  timestamp: string
  type: string
  quantity: number
  price: number
  fee: number
}

interface PriceData {
  timestamp: number
  price: number
}

interface PriceChartWithTransactionsProps {
  sparkline?: number[]
  priceData?: PriceData[]
  transactions: Transaction[]
  avgBuyPrice?: number
  symbol: string
  currentPrice: number
}

export function PriceChartWithTransactions({
  sparkline,
  priceData,
  transactions,
  avgBuyPrice,
  symbol,
  currentPrice,
}: PriceChartWithTransactionsProps) {
  const chartData = useMemo(() => {
    console.log('📊 Chart Data Calculation:', {
      hasPriceData: !!priceData,
      priceDataLength: priceData?.length || 0,
      hasSparkline: !!sparkline,
      sparklineLength: sparkline?.length || 0,
      firstPriceData: priceData?.[0],
      firstSparkline: sparkline?.[0]
    })

    // Use priceData if available, otherwise use sparkline
    if (priceData && priceData.length > 0) {
      console.log('✅ Using priceData:', priceData.length, 'points')
      
      // Log first, middle, and last data points for debugging
      const first = priceData[0]
      const middle = priceData[Math.floor(priceData.length / 2)]
      const last = priceData[priceData.length - 1]
      
      console.log('📊 Price Data Range:', {
        first: { 
          timestamp: first.timestamp, 
          date: new Date(first.timestamp).toISOString(),
          price: first.price 
        },
        middle: { 
          timestamp: middle.timestamp, 
          date: new Date(middle.timestamp).toISOString(),
          price: middle.price 
        },
        last: { 
          timestamp: last.timestamp, 
          date: new Date(last.timestamp).toISOString(),
          price: last.price 
        },
        rangeInDays: (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24)
      })
      
      return priceData
    }

    if (!sparkline || sparkline.length === 0) {
      console.log('❌ No data available')
      return []
    }

    console.log('⚠️ Falling back to sparkline:', sparkline.length, 'points')
    // Create data points from sparkline (7 days = 168 hours)
    const now = Date.now()
    const hourInMs = 60 * 60 * 1000
    const startTime = now - (sparkline.length * hourInMs)

    return sparkline.map((price, index) => ({
      timestamp: startTime + (index * hourInMs),
      price,
    }))
  }, [sparkline, priceData])

  const transactionMarkers = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    // Filter transactions within chart timeframe
    const chartStart = chartData[0]?.timestamp || 0
    const chartEnd = chartData[chartData.length - 1]?.timestamp || Date.now()

    return transactions
      .filter(tx => {
        const txTime = new Date(tx.timestamp).getTime()
        return txTime >= chartStart && txTime <= chartEnd
      })
      .map(tx => ({
        timestamp: new Date(tx.timestamp).getTime(),
        price: tx.price,
        type: tx.type,
        quantity: tx.quantity,
        fee: tx.fee,
      }))
  }, [transactions, chartData])

  const isPositive = currentPrice >= (chartData[0]?.price || currentPrice)

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Chart data not available
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isPositive ? '#22c55e' : '#f87171'}
                stopOpacity={0.8}
              />
              <stop
                offset="50%"
                stopColor={isPositive ? '#22c55e' : '#f87171'}
                stopOpacity={0.4}
              />
              <stop
                offset="100%"
                stopColor={isPositive ? '#22c55e' : '#f87171'}
                stopOpacity={0.1}
              />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" opacity={0.5} />
        
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(timestamp) => {
            // Calculate time range to determine format
            const firstTimestamp = chartData[0]?.timestamp || timestamp
            const lastTimestamp = chartData[chartData.length - 1]?.timestamp || timestamp
            const rangeInDays = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60 * 24)
            
            // Use different formats based on time range
            if (rangeInDays < 1) {
              // Less than 1 day: show hours
              return format(new Date(timestamp), 'HH:mm')
            } else if (rangeInDays < 7) {
              // Less than 7 days: show day and time
              return format(new Date(timestamp), 'MMM d HH:mm')
            } else if (rangeInDays < 90) {
              // Less than 90 days: show month and day
              return format(new Date(timestamp), 'MMM d')
            } else {
              // More than 90 days: show month and year
              return format(new Date(timestamp), 'MMM yyyy')
            }
          }}
          stroke="#6b7280"
          fontSize={12}
          tick={{ fill: '#374151' }}
        />
        
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          stroke="#6b7280"
          fontSize={12}
          tick={{ fill: '#374151' }}
        />

        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null

            const data = payload[0].payload
            const isTransaction = 'type' in data
            
            // Calculate price change from first data point
            const firstPrice = chartData[0]?.price || data.price
            const priceChange = data.price - firstPrice
            const priceChangePercent = (priceChange / firstPrice) * 100

            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg min-w-[200px]">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {format(new Date(data.timestamp), 'MMM d, yyyy HH:mm:ss')}
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Price:</span>
                    <span className="text-sm font-bold">
                      ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Change:</span>
                    <span className={`text-xs font-medium ${
                      priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {isTransaction && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className={`text-xs font-bold mb-1 ${
                      data.type === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      🎯 {data.type.toUpperCase()} TRANSACTION
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Amount: {data.quantity.toLocaleString()} {symbol}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Value: ${(data.quantity * data.price).toLocaleString()}
                    </div>
                    {data.fee > 0 && (
                      <div className="text-xs text-gray-500">
                        Fee: ${data.fee.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }}
        />

        {/* Avg Buy Price Reference Line */}
        {avgBuyPrice && (
          <ReferenceLine
            y={avgBuyPrice}
            stroke="#3b82f6"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Avg Buy: $${avgBuyPrice.toFixed(2)}`,
              position: 'right',
              fill: '#3b82f6',
              fontSize: 12,
            }}
          />
        )}

        {/* Price Area */}
        <Area
          type="monotone"
          dataKey="price"
          stroke={isPositive ? '#22c55e' : '#f87171'}
          strokeWidth={4}
          fill="url(#colorPrice)"
          animationDuration={500}
          dot={false}
          activeDot={{ r: 8, strokeWidth: 3, fill: isPositive ? '#22c55e' : '#f87171', stroke: '#fff' }}
        />

        {/* Transaction Markers */}
        {transactionMarkers.length > 0 && (
          <Scatter
            data={transactionMarkers}
            fill="#8884d8"
            shape={(props: any) => {
              const { cx, cy, payload } = props
              const isBuy = payload.type === 'buy' || payload.type === 'deposit' || payload.type === 'airdrop'
              const color = isBuy ? '#10b981' : '#ef4444'
              
              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill="#fff"
                  />
                </g>
              )
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
    </div>
  )
}
