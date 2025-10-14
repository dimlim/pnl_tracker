import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Search CoinGecko
    const response = await fetch(
      `${COINGECKO_API}/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('CoinGecko API error')
    }

    const data = await response.json()
    
    // Format results
    const results = data.coins?.slice(0, 10).map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      thumb: coin.thumb,
      market_cap_rank: coin.market_cap_rank,
    })) || []

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search cryptocurrencies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { coingeckoId } = await request.json()

    if (!coingeckoId) {
      return NextResponse.json(
        { error: 'coingeckoId is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Fetch coin details from CoinGecko
    const response = await fetch(
      `${COINGECKO_API}/coins/${coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch coin details')
    }

    const coin = await response.json()

    // Check if asset already exists
    const { data: existing } = await supabase
      .from('assets')
      .select('id')
      .eq('coingecko_id', coin.id)
      .single()

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        asset: existing,
        message: 'Asset already exists'
      })
    }

    // Insert new asset
    const { data: newAsset, error } = await supabase
      .from('assets')
      .insert({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        coingecko_id: coin.id,
        icon_url: coin.image?.small || coin.image?.thumb,
        current_price: coin.market_data?.current_price?.usd || 0,
        ath: coin.market_data?.ath?.usd || 0,
        ath_date: coin.market_data?.ath_date?.usd || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to add asset to database')
    }

    return NextResponse.json({ 
      success: true, 
      asset: newAsset,
      message: 'Asset added successfully'
    })
  } catch (error) {
    console.error('Add asset error:', error)
    return NextResponse.json(
      { error: 'Failed to add cryptocurrency' },
      { status: 500 }
    )
  }
}
