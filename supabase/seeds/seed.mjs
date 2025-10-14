import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key)

async function run() {
  console.log('🌱 Seeding database...')

  // Seed popular crypto assets
  const assets = [
    { slug: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon_url: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
    { slug: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon_url: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    { slug: 'tether', symbol: 'USDT', name: 'Tether', icon_url: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    { slug: 'binancecoin', symbol: 'BNB', name: 'BNB', icon_url: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
    { slug: 'solana', symbol: 'SOL', name: 'Solana', icon_url: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
    { slug: 'ripple', symbol: 'XRP', name: 'XRP', icon_url: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
    { slug: 'usd-coin', symbol: 'USDC', name: 'USD Coin', icon_url: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
    { slug: 'cardano', symbol: 'ADA', name: 'Cardano', icon_url: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
    { slug: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', icon_url: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
    { slug: 'tron', symbol: 'TRX', name: 'TRON', icon_url: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png' }
  ]

  for (const asset of assets) {
    const { error } = await supabase
      .from('assets')
      .upsert(asset, { onConflict: 'slug' })
    
    if (error) {
      console.error(`Error seeding ${asset.symbol}:`, error)
    } else {
      console.log(`✓ Seeded ${asset.symbol}`)
    }
  }

  console.log('✅ Seed completed!')
}

run().catch(console.error)
