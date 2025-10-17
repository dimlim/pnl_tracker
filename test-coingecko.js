#!/usr/bin/env node

/**
 * Test script to verify CoinGecko API responses
 * Run: node test-coingecko.js
 */

async function testCoinGeckoAPI() {
  const periods = [
    { name: '24H', days: 1 },
    { name: '7D', days: 7 },
    { name: '1M', days: 30 },
    { name: '3M', days: 90 },
    { name: '1Y', days: 365 },
  ]

  console.log('🧪 Testing CoinGecko API for Ethereum\n')
  console.log('=' .repeat(60))

  for (const period of periods) {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${period.days}`
      console.log(`\n📊 Testing ${period.name} (${period.days} days)`)
      console.log(`🔗 URL: ${url}`)

      const response = await fetch(url)
      console.log(`📡 Status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ Error: ${errorText}`)
        continue
      }

      const data = await response.json()
      const prices = data.prices || []

      if (prices.length === 0) {
        console.log('⚠️  No price data returned')
        continue
      }

      const first = prices[0]
      const last = prices[prices.length - 1]
      const rangeMs = last[0] - first[0]
      const rangeDays = rangeMs / (1000 * 60 * 60 * 24)

      console.log(`✅ Success:`)
      console.log(`   📈 Data points: ${prices.length}`)
      console.log(`   📅 First: ${new Date(first[0]).toISOString()} - $${first[1].toFixed(2)}`)
      console.log(`   📅 Last:  ${new Date(last[0]).toISOString()} - $${last[1].toFixed(2)}`)
      console.log(`   ⏱️  Range: ${rangeDays.toFixed(2)} days (requested: ${period.days})`)

      if (rangeDays < period.days * 0.8) {
        console.log(`   ⚠️  WARNING: Got only ${(rangeDays / period.days * 100).toFixed(1)}% of requested data`)
      }

      // Wait 1 second between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Test complete\n')
}

testCoinGeckoAPI().catch(console.error)
