import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface CoinGeckoMarketData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  image: string
}

interface CoinGeckoHistoricalData {
  prices: [number, number][]
}

/**
 * Fetch current prices from CoinGecko
 */
export async function fetchCurrentPrices(coinIds: string[]) {
  try {
    const ids = coinIds.join(',')
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data: CoinGeckoMarketData[] = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching current prices:', error)
    return []
  }
}

/**
 * Fetch historical price data from CoinGecko
 */
export async function fetchHistoricalPrices(coinId: string, days: number = 30) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data: CoinGeckoHistoricalData = await response.json()
    return data.prices.map(([timestamp, price]) => ({
      timestamp: new Date(timestamp),
      price,
    }))
  } catch (error) {
    console.error('Error fetching historical prices:', error)
    return []
  }
}

/**
 * Update asset prices in database
 */
export async function updateAssetPrices(assets: { id: number; coingecko_id?: string }[]) {
  const coingeckoIds = assets
    .filter(a => a.coingecko_id)
    .map(a => a.coingecko_id!)

  if (coingeckoIds.length === 0) {
    console.log('No assets with CoinGecko IDs found')
    return
  }

  const prices = await fetchCurrentPrices(coingeckoIds)

  for (const priceData of prices) {
    const asset = assets.find(a => a.coingecko_id === priceData.id)
    if (!asset) continue

    // Update asset current price
    await supabase
      .from('assets')
      .update({
        current_price: priceData.current_price,
        price_change_24h: priceData.price_change_percentage_24h,
        market_cap: priceData.market_cap,
        last_updated: new Date().toISOString(),
      })
      .eq('id', asset.id)

    // Insert price tick
    await supabase.from('price_ticks').insert({
      asset_id: asset.id,
      source: 'coingecko',
      ts: new Date().toISOString(),
      price: priceData.current_price,
    })

    console.log(`Updated price for ${priceData.name}: $${priceData.current_price}`)
  }
}

/**
 * Seed historical price data for an asset
 */
export async function seedHistoricalPrices(assetId: number, coingeckoId: string, days: number = 30) {
  console.log(`Seeding historical prices for asset ${assetId} (${coingeckoId})...`)
  
  const historicalData = await fetchHistoricalPrices(coingeckoId, days)

  if (historicalData.length === 0) {
    console.log('No historical data found')
    return
  }

  // Delete existing price ticks for this asset
  await supabase
    .from('price_ticks')
    .delete()
    .eq('asset_id', assetId)

  // Insert historical price ticks
  const priceTicks = historicalData.map(({ timestamp, price }) => ({
    asset_id: assetId,
    source: 'coingecko',
    ts: timestamp.toISOString(),
    price,
  }))

  const { error } = await supabase.from('price_ticks').insert(priceTicks)

  if (error) {
    console.error('Error inserting price ticks:', error)
  } else {
    console.log(`Inserted ${priceTicks.length} price ticks for asset ${assetId}`)
  }
}
