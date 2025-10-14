import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// CoinGecko API endpoint
const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Map our symbols to CoinGecko IDs
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

export async function GET() {
  try {
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

    // Get all assets from our database
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, symbol, coingecko_id')

    if (assetsError) {
      return NextResponse.json({ error: assetsError.message }, { status: 500 })
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json({ message: 'No assets found' }, { status: 200 })
    }

    // Build CoinGecko IDs list
    const coingeckoIds = assets
      .map((asset) => asset.coingecko_id || SYMBOL_TO_COINGECKO_ID[asset.symbol])
      .filter(Boolean)
      .join(',')

    if (!coingeckoIds) {
      return NextResponse.json({ message: 'No CoinGecko IDs to fetch' }, { status: 200 })
    }

    // Fetch prices from CoinGecko
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coingeckoIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch prices from CoinGecko' },
        { status: response.status }
      )
    }

    const prices = await response.json()

    console.log('Fetched prices from CoinGecko:', prices)

    // Update prices in database
    const updates = []
    for (const asset of assets) {
      const coingeckoId = asset.coingecko_id || SYMBOL_TO_COINGECKO_ID[asset.symbol]
      if (coingeckoId && prices[coingeckoId]) {
        const priceData = prices[coingeckoId]
        console.log(`Updating ${asset.symbol} (${coingeckoId}): $${priceData.usd}`)
        
        const { error: updateError } = await supabase
          .from('assets')
          .update({
            current_price: priceData.usd,
            price_change_24h: priceData.usd_24h_change || 0,
            market_cap: priceData.usd_market_cap || 0,
            last_updated: new Date().toISOString(),
          })
          .eq('id', asset.id)
        
        if (updateError) {
          console.error(`Failed to update ${asset.symbol}:`, updateError)
        } else {
          updates.push(asset.symbol)
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating prices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
