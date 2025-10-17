/**
 * CoinGecko API Service
 * Free tier: 10-30 calls/minute
 * Docs: https://docs.coingecko.com/reference/introduction
 */

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

interface CoinGeckoMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
  sparkline_in_7d?: {
    price: number[]
  }
  price_change_percentage_1h_in_currency?: number
  price_change_percentage_7d_in_currency?: number
}

export interface MarketData {
  id: string
  symbol: string
  name: string
  rank: number
  iconUrl: string
  currentPrice: number
  priceChange1h: number
  priceChange24h: number
  priceChange7d: number
  marketCap: number
  volume24h: number
  circulatingSupply: number
  sparkline7d: number[]
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute

/**
 * Retry helper for fetch requests with rate limit handling
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })
      
      // Handle rate limiting (429)
      if (response.status === 429) {
        const isLastAttempt = i === retries - 1
        if (isLastAttempt) {
          console.error('❌ Rate limit exceeded, all retries exhausted')
          throw new Error('CoinGecko API rate limit exceeded. Please try again later.')
        }
        
        // Wait longer for rate limits (60 seconds)
        const rateLimitDelay = 60000
        console.warn(`⚠️ Rate limit hit (429), waiting ${rateLimitDelay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay))
        continue
      }
      
      return response
    } catch (error) {
      const isLastAttempt = i === retries - 1
      if (isLastAttempt) throw error
      
      console.warn(`⚠️ Fetch attempt ${i + 1} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
  throw new Error('All retry attempts failed')
}

/**
 * Fetch markets data from CoinGecko
 */
export async function fetchCoinGeckoMarkets(params: {
  perPage?: number
  page?: number
}): Promise<MarketData[]> {
  const { perPage = 100, page = 1 } = params

  // Check cache first
  const cacheKey = `markets_${perPage}_${page}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✨ Using cached data for', cacheKey)
    return cached.data
  }

  try {
    const url = new URL(`${COINGECKO_API_BASE}/coins/markets`)
    url.searchParams.set('vs_currency', 'usd')
    url.searchParams.set('order', 'market_cap_desc')
    url.searchParams.set('per_page', perPage.toString())
    url.searchParams.set('page', page.toString())
    url.searchParams.set('sparkline', 'true')
    url.searchParams.set('price_change_percentage', '1h,24h,7d')

    console.log('🌐 Calling CoinGecko API:', url.toString())

    const response = await fetchWithRetry(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    })

    console.log('📡 CoinGecko API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ CoinGecko API error:', response.status, response.statusText)
      console.error('❌ Error body:', errorText)
      throw new Error(`CoinGecko API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json() as CoinGeckoMarket[]
    console.log('✅ CoinGecko returned', data.length, 'coins')

    const result = data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      rank: coin.market_cap_rank,
      iconUrl: coin.image,
      currentPrice: coin.current_price,
      priceChange1h: coin.price_change_percentage_1h_in_currency || 0,
      priceChange24h: coin.price_change_percentage_24h || 0,
      priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      circulatingSupply: coin.circulating_supply,
      sparkline7d: coin.sparkline_in_7d?.price || [],
    }))

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    console.log('💾 Cached data for', cacheKey)

    return result
  } catch (error) {
    console.error('Failed to fetch CoinGecko markets:', error)
    
    // If we have stale cache, use it as fallback
    if (cached) {
      console.warn('⚠️ Using stale cache due to error')
      return cached.data
    }
    
    throw error
  }
}

/**
 * Fetch detailed coin data
 */
export async function fetchCoinGeckoDetail(coinId: string) {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}`
    const params = new URLSearchParams({
      localization: 'false',
      tickers: 'false',
      market_data: 'true',
      community_data: 'false',
      developer_data: 'false',
      sparkline: 'true',
    })

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch CoinGecko detail:', error)
    throw error
  }
}

/**
 * Fetch historical market chart data
 */
export async function fetchCoinGeckoChart(params: {
  coinId: string
  days: number | 'max'
  interval?: 'daily' | 'hourly'
}) {
  const { coinId, days, interval } = params

  try {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart`
    const searchParams = new URLSearchParams({
      vs_currency: 'usd',
      days: days.toString(),
    })

    if (interval) {
      searchParams.set('interval', interval)
    }

    const response = await fetch(`${url}?${searchParams}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch CoinGecko chart:', error)
    throw error
  }
}

/**
 * Search coins by query
 */
export async function searchCoinGecko(query: string) {
  // Check cache first
  const cacheKey = `search_${query.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✨ Using cached search for', query)
    return cached.data
  }

  try {
    const url = `${COINGECKO_API_BASE}/search`
    const params = new URLSearchParams({ query })

    const response = await fetchWithRetry(`${url}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('CoinGecko search API error:', response.status)
      // Return stale cache if available
      if (cached) {
        console.warn('⚠️ Using stale search cache due to error')
        return cached.data
      }
      return []
    }

    const data = await response.json() as any
    const result = data.coins || []
    
    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    console.log('💾 Cached search for', query)
    
    return result
  } catch (error) {
    console.error('Failed to search CoinGecko:', error)
    // Return stale cache if available
    if (cached) {
      console.warn('⚠️ Using stale search cache due to error')
      return cached.data
    }
    return []
  }
}

/**
 * Get trending coins
 */
export async function fetchTrendingCoins() {
  try {
    const url = `${COINGECKO_API_BASE}/search/trending`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json() as any
    return data.coins || []
  } catch (error) {
    console.error('Failed to fetch trending coins:', error)
    throw error
  }
}
