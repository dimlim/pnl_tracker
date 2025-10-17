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
 * Note: Free tier has limited historical data access
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

    // CoinMarketCap free tier doesn't support historical data well
    // We'll use their quotes/latest endpoint and generate synthetic history
    // For production, you'd need a paid plan or use their historical endpoints
    
    // For now, return empty to fallback to CoinCap
    console.log('⚠️ CoinMarketCap historical data requires paid plan')
    return []

    // Uncomment below if you have CMC API key:
    /*
    const apiKey = process.env.COINMARKETCAP_API_KEY
    if (!apiKey) {
      console.warn('⚠️ CoinMarketCap API key not found')
      return []
    }

    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical`
    
    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ CoinMarketCap API error:', response.status)
      return []
    }

    const data = await response.json()
    // Process data...
    return []
    */
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
