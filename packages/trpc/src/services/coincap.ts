/**
 * CoinCap API Service
 * Free, unlimited API for cryptocurrency data
 * Docs: https://docs.coincap.io/
 */

// Map common coin IDs to CoinCap IDs
const COIN_ID_MAP: Record<string, string> = {
  'bitcoin': 'bitcoin',
  'ethereum': 'ethereum',
  'solana': 'solana',
  'cardano': 'cardano',
  'ripple': 'xrp',
  'polkadot': 'polkadot',
  'dogecoin': 'dogecoin',
  'avalanche-2': 'avalanche',
  'polygon': 'polygon',
  'chainlink': 'chainlink',
  'uniswap': 'uniswap',
  'litecoin': 'litecoin',
  'stellar': 'stellar',
  'cosmos': 'cosmos',
  'monero': 'monero',
}

interface CoinCapHistoryResponse {
  data: Array<{
    priceUsd: string
    time: number
    date: string
  }>
  timestamp: number
}

/**
 * Fetch historical price data from CoinCap API
 */
export async function fetchCoinCapHistory(
  coinId: string,
  days: number | 'max'
): Promise<Array<{ timestamp: number; price: number }>> {
  try {
    // Map CoinGecko ID to CoinCap ID
    const coincapId = COIN_ID_MAP[coinId] || coinId

    // Calculate interval based on days
    let interval = 'd1' // daily
    if (typeof days === 'number') {
      if (days < 2) {
        interval = 'h1' // hourly for 1 day
      } else if (days <= 7) {
        interval = 'h1' // hourly for week
      } else if (days > 365) {
        interval = 'd1' // daily for long periods
      }
    } else if (days === 'max') {
      interval = 'd1' // daily for max
    }

    // Calculate start and end timestamps
    const end = Date.now()
    let start = end - (typeof days === 'number' ? days * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000)

    const url = `https://api.coincap.io/v2/assets/${coincapId}/history?interval=${interval}&start=${start}&end=${end}`
    
    console.log('🔍 Fetching CoinCap data:', { coincapId, days, interval, url })

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ CoinCap API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      return []
    }

    const data = (await response.json()) as CoinCapHistoryResponse

    if (!data.data || data.data.length === 0) {
      console.warn('⚠️ CoinCap returned empty data')
      return []
    }

    // Transform to our format
    const prices = data.data.map((item) => ({
      timestamp: item.time,
      price: parseFloat(item.priceUsd),
    }))

    console.log('✅ CoinCap response:', {
      pricesCount: prices.length,
      first: prices[0],
      last: prices[prices.length - 1],
    })

    return prices
  } catch (error) {
    console.error('Failed to fetch CoinCap data:', error)
    return []
  }
}

/**
 * Get current price from CoinCap
 */
export async function fetchCoinCapPrice(coinId: string): Promise<number | null> {
  try {
    const coincapId = COIN_ID_MAP[coinId] || coinId
    const url = `https://api.coincap.io/v2/assets/${coincapId}`

    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json() as { data: { priceUsd: string } }
    return parseFloat(data.data.priceUsd)
  } catch (error) {
    console.error('Failed to fetch CoinCap price:', error)
    return null
  }
}
