/**
 * CoinMarketCap API Service
 * Professional cryptocurrency data API
 * Docs: https://coinmarketcap.com/api/documentation/v1/
 */

// Map common coin IDs to CoinMarketCap symbols
const COIN_SYMBOL_MAP: Record<string, string> = {
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'solana': 'SOL',
  'cardano': 'ADA',
  'ripple': 'XRP',
  'polkadot': 'DOT',
  'dogecoin': 'DOGE',
  'avalanche-2': 'AVAX',
  'polygon': 'MATIC',
  'chainlink': 'LINK',
  'uniswap': 'UNI',
  'litecoin': 'LTC',
  'stellar': 'XLM',
  'cosmos': 'ATOM',
  'monero': 'XMR',
}

interface CMCQuote {
  timestamp: string
  quote: {
    USD: {
      price: number
      volume_24h: number
      market_cap: number
    }
  }
}

/**
 * Fetch historical price data from CoinMarketCap API
 */
export async function fetchCoinMarketCapHistory(
  coinId: string,
  days: number | 'max'
): Promise<Array<{ timestamp: number; price: number }>> {
  try {
    // Map CoinGecko ID to CMC symbol
    const symbol = COIN_SYMBOL_MAP[coinId]
    if (!symbol) {
      console.warn('⚠️ CoinMarketCap: Unknown coin ID:', coinId)
      return []
    }

    const apiKey = process.env.COINMARKETCAP_API_KEY || '640c8b9a-56da-49f4-965c-961037e98d09'
    
    console.log('🔍 Fetching CoinMarketCap data:', { symbol, days })

    // CoinMarketCap uses different endpoints
    // For historical data, we need to use OHLCV endpoint
    // Calculate time range
    const now = Date.now()
    const daysNum = typeof days === 'number' ? days : 365
    const start = new Date(now - daysNum * 24 * 60 * 60 * 1000)
    
    // Use OHLCV historical endpoint (requires Basic plan or higher)
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical?symbol=${symbol}&time_start=${start.toISOString()}&time_end=${new Date(now).toISOString()}&interval=daily`
    
    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ CoinMarketCap API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return []
    }

    const data = await response.json() as any
    
    if (!data.data || !data.data.quotes) {
      console.warn('⚠️ CoinMarketCap returned no data')
      return []
    }

    // Transform CMC format to our format
    const prices = data.data.quotes.map((quote: any) => ({
      timestamp: new Date(quote.time_open).getTime(),
      price: quote.quote.USD.close,
    }))

    console.log('✅ CoinMarketCap response:', {
      pricesCount: prices.length,
      first: prices[0],
      last: prices[prices.length - 1]
    })

    return prices
  } catch (error) {
    console.error('Failed to fetch CoinMarketCap data:', error)
    return []
  }
}

/**
 * Get current price from CoinMarketCap
 */
export async function fetchCoinMarketCapPrice(coinId: string): Promise<number | null> {
  try {
    const symbol = COIN_SYMBOL_MAP[coinId]
    if (!symbol) return null

    // This would require API key
    // For free tier, CoinGecko is better
    return null
  } catch (error) {
    console.error('Failed to fetch CoinMarketCap price:', error)
    return null
  }
}
