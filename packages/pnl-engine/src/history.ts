import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns'

export interface HistoricalDataPoint {
  timestamp: Date
  totalValue: number
  totalCost: number
  totalPnl: number
  roi: number
}

export interface Transaction {
  id: number
  asset_id: number
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out'
  quantity: number
  price: number
  fee: number
  timestamp: Date
}

export interface AssetPrice {
  asset_id: number
  symbol: string
  price: number
}

export interface Position {
  asset_id: number
  quantity: number
  avgCost: number
  totalCost: number
}

export type PnLMethod = 'fifo' | 'lifo' | 'avg'

/**
 * Calculate portfolio history for a given date range
 */
export async function calculatePortfolioHistory(
  transactions: Transaction[],
  days: number,
  method: PnLMethod,
  getHistoricalPrices: (date: Date, assetIds: number[]) => Promise<AssetPrice[]>
): Promise<HistoricalDataPoint[]> {
  const today = new Date()
  const startDate = startOfDay(subDays(today, days - 1))
  const endDate = endOfDay(today)

  // Generate array of dates
  const dates = eachDayOfInterval({ start: startDate, end: endDate })

  // Calculate for each day
  const history: HistoricalDataPoint[] = []

  for (const date of dates) {
    const dataPoint = await calculateDaySnapshot(
      transactions,
      date,
      method,
      getHistoricalPrices
    )
    history.push(dataPoint)
  }

  return history
}

/**
 * Calculate portfolio snapshot for a specific day
 */
async function calculateDaySnapshot(
  allTransactions: Transaction[],
  date: Date,
  method: PnLMethod,
  getHistoricalPrices: (date: Date, assetIds: number[]) => Promise<AssetPrice[]>
): Promise<HistoricalDataPoint> {
  const dayEnd = endOfDay(date)

  // Get all transactions up to this day
  const transactionsUpToDate = allTransactions.filter(
    (tx) => new Date(tx.timestamp) <= dayEnd
  )

  // Calculate positions using PnL method
  const positions = calculatePositions(transactionsUpToDate, method)

  // Get unique asset IDs
  const assetIds = Array.from(new Set(positions.map((p) => p.asset_id)))

  if (assetIds.length === 0) {
    return {
      timestamp: date,
      totalValue: 0,
      totalCost: 0,
      totalPnl: 0,
      roi: 0,
    }
  }

  // Fetch historical prices for this day
  const prices = await getHistoricalPrices(date, assetIds)
  const priceMap = new Map(prices.map((p) => [p.asset_id, p.price]))

  // Calculate totals
  let totalValue = 0
  let totalCost = 0

  for (const position of positions) {
    const price = priceMap.get(position.asset_id) || 0
    totalValue += position.quantity * price
    totalCost += position.totalCost
  }

  const totalPnl = totalValue - totalCost
  const roi = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  return {
    timestamp: date,
    totalValue,
    totalCost,
    totalPnl,
    roi,
  }
}

/**
 * Calculate positions from transactions using specified method
 */
function calculatePositions(
  transactions: Transaction[],
  method: PnLMethod
): Position[] {
  const positionMap = new Map<number, Position>()

  // Sort transactions by timestamp
  const sortedTxs = [...transactions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  for (const tx of sortedTxs) {
    const isBuy = tx.type === 'buy' || tx.type === 'transfer_in'
    const position = positionMap.get(tx.asset_id) || {
      asset_id: tx.asset_id,
      quantity: 0,
      avgCost: 0,
      totalCost: 0,
    }

    if (isBuy) {
      // Add to position
      const txCost = tx.quantity * tx.price + tx.fee
      const newQuantity = position.quantity + tx.quantity
      const newTotalCost = position.totalCost + txCost

      position.quantity = newQuantity
      position.totalCost = newTotalCost
      position.avgCost = newQuantity > 0 ? newTotalCost / newQuantity : 0
    } else {
      // Sell or transfer out
      if (method === 'avg') {
        // Average cost method
        const costToRemove = tx.quantity * position.avgCost
        position.quantity -= tx.quantity
        position.totalCost -= costToRemove
      } else if (method === 'fifo') {
        // FIFO - remove from oldest first
        // For simplicity, use average cost (full FIFO requires lot tracking)
        const costToRemove = tx.quantity * position.avgCost
        position.quantity -= tx.quantity
        position.totalCost -= costToRemove
      } else if (method === 'lifo') {
        // LIFO - remove from newest first
        // For simplicity, use average cost (full LIFO requires lot tracking)
        const costToRemove = tx.quantity * position.avgCost
        position.quantity -= tx.quantity
        position.totalCost -= costToRemove
      }

      // Recalculate average cost
      position.avgCost = position.quantity > 0 ? position.totalCost / position.quantity : 0
    }

    // Update or remove position
    if (position.quantity > 0.000001) {
      positionMap.set(tx.asset_id, position)
    } else {
      positionMap.delete(tx.asset_id)
    }
  }

  return Array.from(positionMap.values())
}

/**
 * Batch fetch historical prices from CoinGecko
 */
export async function fetchHistoricalPricesFromCoinGecko(
  date: Date,
  assets: Array<{ id: number; symbol: string; coingecko_id?: string }>
): Promise<AssetPrice[]> {
  const timestamp = Math.floor(date.getTime() / 1000)
  const prices: AssetPrice[] = []

  // CoinGecko rate limit: 10-50 calls/minute on free tier
  // Batch requests with delay
  const BATCH_SIZE = 5
  const DELAY_MS = 1000

  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    const batch = assets.slice(i, i + BATCH_SIZE)
    const batchPromises = batch.map(async (asset) => {
      try {
        const coinId = asset.coingecko_id || getCoinGeckoId(asset.symbol)
        if (!coinId) {
          console.warn(`No CoinGecko ID for ${asset.symbol}`)
          return null
        }

        // Fetch price for specific day
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=usd&from=${timestamp - 86400}&to=${timestamp}`
        
        const response = await fetch(url)
        if (!response.ok) {
          console.error(`CoinGecko API error for ${asset.symbol}: ${response.status}`)
          return null
        }

        const data = await response.json() as { prices?: Array<[number, number]> }
        
        // Get price closest to our timestamp
        if (data.prices && data.prices.length > 0) {
          const price = data.prices[data.prices.length - 1][1]
          return {
            asset_id: asset.id,
            symbol: asset.symbol,
            price,
          }
        }

        return null
      } catch (error) {
        console.error(`Error fetching price for ${asset.symbol}:`, error)
        return null
      }
    })

    const batchResults = await Promise.all(batchPromises)
    prices.push(...batchResults.filter((p): p is AssetPrice => p !== null))

    // Delay between batches to respect rate limits
    if (i + BATCH_SIZE < assets.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
    }
  }

  return prices
}

/**
 * Map crypto symbols to CoinGecko IDs
 */
function getCoinGeckoId(symbol: string): string | null {
  const mapping: Record<string, string> = {
    btc: 'bitcoin',
    eth: 'ethereum',
    sol: 'solana',
    usdt: 'tether',
    usdc: 'usd-coin',
    bnb: 'binancecoin',
    xrp: 'ripple',
    ada: 'cardano',
    doge: 'dogecoin',
    matic: 'matic-network',
    dot: 'polkadot',
    dai: 'dai',
    avax: 'avalanche-2',
    link: 'chainlink',
    uni: 'uniswap',
    atom: 'cosmos',
    ltc: 'litecoin',
    etc: 'ethereum-classic',
    xlm: 'stellar',
    algo: 'algorand',
  }

  return mapping[symbol.toLowerCase()] || null
}
