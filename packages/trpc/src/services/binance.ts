/**
 * Binance API Service
 * FREE and UNLIMITED public data API
 * Docs: https://binance-docs.github.io/apidocs/spot/en/
 */

// Map common coin IDs to Binance trading pairs
const COIN_SYMBOL_MAP: Record<string, string> = {
  'bitcoin': 'BTCUSDT',
  'ethereum': 'ETHUSDT',
  'solana': 'SOLUSDT',
  'cardano': 'ADAUSDT',
  'ripple': 'XRPUSDT',
  'polkadot': 'DOTUSDT',
  'dogecoin': 'DOGEUSDT',
  'avalanche-2': 'AVAXUSDT',
  'polygon': 'MATICUSDT',
  'chainlink': 'LINKUSDT',
  'uniswap': 'UNIUSDT',
  'litecoin': 'LTCUSDT',
  'stellar': 'XLMUSDT',
  'cosmos': 'ATOMUSDT',
  'monero': 'XMRUSDT',
  'tron': 'TRXUSDT',
  'shiba-inu': 'SHIBUSDT',
  'wrapped-bitcoin': 'WBTCUSDT',
  'dai': 'DAIUSDT',
  'leo-token': 'LEOUSDT',
}

interface BinanceKline {
  0: number  // Open time
  1: string  // Open
  2: string  // High
  3: string  // Low
  4: string  // Close
  5: string  // Volume
  6: number  // Close time
  7: string  // Quote asset volume
  8: number  // Number of trades
  9: string  // Taker buy base asset volume
  10: string // Taker buy quote asset volume
  11: string // Ignore
}

/**
 * Fetch historical price data from Binance API
 * FREE and UNLIMITED - no API key needed!
 */
export async function fetchBinanceHistory(
  coinId: string,
  days: number | 'max'
): Promise<Array<{ timestamp: number; price: number }>> {
  try {
    // Map CoinGecko ID to Binance symbol
    const symbol = COIN_SYMBOL_MAP[coinId]
    if (!symbol) {
      console.warn('⚠️ Binance: Unknown coin ID:', coinId)
      return []
    }

    // Determine interval based on days
    let interval = '1d' // daily
    let limit = 1000 // max limit per request
    
    if (typeof days === 'number') {
      if (days <= 1) {
        interval = '1h' // hourly for 1 day
        limit = 24
      } else if (days <= 7) {
        interval = '1h' // hourly for week
        limit = days * 24
      } else if (days <= 30) {
        interval = '1d' // daily for month
        limit = days
      } else if (days <= 90) {
        interval = '1d' // daily for 3 months
        limit = days
      } else {
        interval = '1d' // daily for long periods
        limit = Math.min(days, 1000)
      }
    } else if (days === 'max') {
      interval = '1d'
      limit = 1000 // Binance max limit
    }

    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    
    console.log('🔍 Fetching Binance data:', { 
      coinId,
      symbol, 
      days, 
      interval,
      limit,
      url 
    })

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Binance API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url
      })
      return []
    }

    const data = await response.json() as BinanceKline[]

    if (!data || data.length === 0) {
      console.warn('⚠️ Binance returned empty data')
      return []
    }

    // Transform Binance klines to our format
    // Use close price (index 4) and close time (index 6)
    const prices = data.map((kline) => ({
      timestamp: kline[6], // Close time in milliseconds
      price: parseFloat(kline[4]), // Close price
    }))

    console.log('✅ Binance response:', {
      pricesCount: prices.length,
      first: prices[0],
      last: prices[prices.length - 1]
    })

    return prices
  } catch (error) {
    console.error('❌ Failed to fetch Binance data:', {
      error: error instanceof Error ? error.message : String(error),
      coinId,
      days
    })
    return []
  }
}

/**
 * Get current price from Binance
 */
export async function fetchBinancePrice(coinId: string): Promise<number | null> {
  try {
    const symbol = COIN_SYMBOL_MAP[coinId]
    if (!symbol) return null

    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`

    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json() as { symbol: string; price: string }
    return parseFloat(data.price)
  } catch (error) {
    console.error('Failed to fetch Binance price:', error)
    return null
  }
}

/**
 * Check if coin is available on Binance
 */
export function isBinanceCoin(coinId: string): boolean {
  return coinId in COIN_SYMBOL_MAP
}
