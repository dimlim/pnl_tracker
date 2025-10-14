import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

export async function GET() {
  try {
    // Use anon key since RLS is disabled for assets table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!anonKey) {
      return NextResponse.json(
        { error: 'SUPABASE_ANON_KEY not configured' },
        { status: 500 }
      )
    }
    
    // Create client with anon key (RLS is disabled for assets)
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const allCoins = []
    const perPage = 250
    const pages = 1 // Get top 250 coins

    // Fetch coins from CoinGecko
    for (let page = 1; page <= pages; page++) {
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        console.error(`Failed to fetch page ${page}:`, response.statusText)
        continue
      }

      const coins = await response.json()
      allCoins.push(...coins)
      
      // Rate limiting - wait 1 second between requests
      if (page < pages) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`Fetched ${allCoins.length} coins from CoinGecko`)

    // Insert or update coins in database
    let inserted = 0
    let updated = 0
    const errorDetails: string[] = []

    for (const coin of allCoins) {
      try {
        // Check if coin exists
        const { data: existing, error: selectError } = await supabase
          .from('assets')
          .select('id')
          .eq('coingecko_id', coin.id)
          .maybeSingle()

        if (selectError) {
          console.error(`Select error for ${coin.symbol}:`, selectError)
          errorDetails.push(`${coin.symbol}: select failed - ${selectError.message}`)
          continue
        }

        const assetData = {
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          coingecko_id: coin.id,
          icon_url: coin.image,
          current_price: coin.current_price || 0,
          price_change_24h: coin.price_change_percentage_24h || 0,
          market_cap: Math.round(coin.market_cap || 0),
          last_updated: new Date().toISOString(),
        }

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('assets')
            .update(assetData)
            .eq('id', existing.id)

          if (error) {
            console.error(`Failed to update ${coin.symbol}:`, error)
            errorDetails.push(`${coin.symbol}: update failed - ${error.message}`)
          } else {
            updated++
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('assets')
            .insert(assetData)

          if (error) {
            console.error(`Failed to insert ${coin.symbol}:`, error)
            errorDetails.push(`${coin.symbol}: insert failed - ${error.message}`)
          } else {
            inserted++
          }
        }
      } catch (error) {
        console.error(`Error processing ${coin.symbol}:`, error)
        errorDetails.push(`${coin.symbol}: exception - ${String(error)}`)
      }
    }

    return NextResponse.json({
      success: true,
      total: allCoins.length,
      inserted,
      updated,
      errors: errorDetails.length,
      errorDetails: errorDetails.slice(0, 10), // First 10 errors
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error syncing crypto:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
