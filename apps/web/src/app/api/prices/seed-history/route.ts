import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  USDC: 'usd-coin',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  TRX: 'tron',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const assetIdParam = searchParams.get('assetId')
    const days = parseInt(searchParams.get('days') || '30')

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    // Get assets to seed
    let query = supabase.from('assets').select('id, symbol, coingecko_id')
    
    if (assetIdParam) {
      query = query.eq('id', parseInt(assetIdParam))
    }

    const { data: assets, error: assetsError } = await query

    if (assetsError) {
      return NextResponse.json({ error: assetsError.message }, { status: 500 })
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json({ message: 'No assets found' }, { status: 200 })
    }

    const results = []

    for (const asset of assets) {
      const coingeckoId = asset.coingecko_id || SYMBOL_TO_COINGECKO_ID[asset.symbol]
      
      if (!coingeckoId) {
        results.push({ asset: asset.symbol, status: 'skipped', reason: 'No CoinGecko ID' })
        continue
      }

      console.log(`Fetching ${days} days of history for ${asset.symbol} (${coingeckoId})...`)

      // Fetch historical data from CoinGecko
      const response = await fetch(
        `${COINGECKO_API}/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
      )

      if (!response.ok) {
        results.push({ 
          asset: asset.symbol, 
          status: 'error', 
          reason: `CoinGecko API error: ${response.status}` 
        })
        continue
      }

      const data = await response.json()
      
      if (!data.prices || data.prices.length === 0) {
        results.push({ asset: asset.symbol, status: 'error', reason: 'No price data' })
        continue
      }

      // Delete existing price ticks for this asset
      await supabase
        .from('price_ticks')
        .delete()
        .eq('asset_id', asset.id)

      // Insert historical price ticks
      const priceTicks = data.prices.map(([timestamp, price]: [number, number]) => ({
        asset_id: asset.id,
        source: 'coingecko',
        ts: new Date(timestamp).toISOString(),
        price,
      }))

      const { error: insertError } = await supabase
        .from('price_ticks')
        .insert(priceTicks)

      if (insertError) {
        results.push({ 
          asset: asset.symbol, 
          status: 'error', 
          reason: insertError.message 
        })
      } else {
        results.push({ 
          asset: asset.symbol, 
          status: 'success', 
          ticksInserted: priceTicks.length 
        })
        console.log(`✓ Inserted ${priceTicks.length} price ticks for ${asset.symbol}`)
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error seeding historical prices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
