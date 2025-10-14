import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// Generate mock price data for testing
function generateMockPrices(basePrice: number, days: number = 30) {
  const prices = []
  const now = new Date()
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Add some randomness to simulate price movement
    const volatility = 0.05 // 5% daily volatility
    const change = (Math.random() - 0.5) * 2 * volatility
    const price = basePrice * (1 + change * (days - i) / days)
    
    prices.push({
      ts: date.toISOString(),
      price: Math.round(price * 100) / 100,
    })
  }
  
  return prices
}

async function seedTestPrices() {
  console.log('Seeding test price data...')
  
  // Get some assets
  const { data: assets, error } = await supabase
    .from('assets')
    .select('id, symbol')
    .in('symbol', ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'])
  
  if (error || !assets) {
    console.error('Error fetching assets:', error)
    return
  }
  
  const basePrices: Record<string, number> = {
    BTC: 95000,
    ETH: 4100,
    SOL: 230,
    BNB: 680,
    XRP: 2.5,
  }
  
  for (const asset of assets) {
    const basePrice = basePrices[asset.symbol]
    if (!basePrice) continue
    
    console.log(`Generating prices for ${asset.symbol}...`)
    
    const prices = generateMockPrices(basePrice, 30)
    
    // Delete existing price ticks
    await supabase
      .from('price_ticks')
      .delete()
      .eq('asset_id', asset.id)
    
    // Insert new price ticks
    const priceTicks = prices.map(p => ({
      asset_id: asset.id,
      source: 'test',
      ts: p.ts,
      price: p.price,
    }))
    
    const { error: insertError } = await supabase
      .from('price_ticks')
      .insert(priceTicks)
    
    if (insertError) {
      console.error(`Error inserting prices for ${asset.symbol}:`, insertError)
    } else {
      console.log(`✓ Inserted ${priceTicks.length} price ticks for ${asset.symbol}`)
      
      // Update current price
      await supabase
        .from('assets')
        .update({
          current_price: prices[prices.length - 1].price,
          last_updated: new Date().toISOString(),
        })
        .eq('id', asset.id)
    }
  }
  
  console.log('Done!')
}

seedTestPrices().catch(console.error)
