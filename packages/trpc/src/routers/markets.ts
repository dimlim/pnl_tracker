import { z } from 'zod'
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from '../context'
import superjson from 'superjson'
import { fetchCoinGeckoMarkets, searchCoinGecko, type MarketData } from '../services/coingecko'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

const publicProcedure = t.procedure
const protectedProcedure = t.procedure.use(isAuthed)
const router = t.router

// Mock data for development - replace with CoinGecko API in production
const MOCK_MARKET_DATA = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    rank: 1,
    iconUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    currentPrice: 45234.56,
    priceChange1h: 0.5,
    priceChange24h: 2.8,
    priceChange7d: 5.2,
    marketCap: 850200000000,
    volume24h: 32500000000,
    circulatingSupply: 19500000,
    sparkline7d: [44000, 44500, 44200, 45000, 44800, 45200, 45234],
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    rank: 2,
    iconUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    currentPrice: 3021.45,
    priceChange1h: -0.3,
    priceChange24h: 1.5,
    priceChange7d: 3.8,
    marketCap: 363000000000,
    volume24h: 15200000000,
    circulatingSupply: 120000000,
    sparkline7d: [2950, 3000, 2980, 3050, 3020, 3040, 3021],
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    rank: 3,
    iconUrl: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    currentPrice: 412.89,
    priceChange1h: 0.8,
    priceChange24h: 4.2,
    priceChange7d: 8.5,
    marketCap: 63400000000,
    volume24h: 1800000000,
    circulatingSupply: 153000000,
    sparkline7d: [380, 390, 395, 405, 410, 415, 412],
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    rank: 4,
    iconUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    currentPrice: 98.76,
    priceChange1h: -1.2,
    priceChange24h: -3.5,
    priceChange7d: -5.8,
    marketCap: 42300000000,
    volume24h: 2100000000,
    circulatingSupply: 428000000,
    sparkline7d: [105, 103, 100, 98, 96, 97, 98],
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    rank: 5,
    iconUrl: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    currentPrice: 0.62,
    priceChange1h: -0.5,
    priceChange24h: -2.1,
    priceChange7d: -4.2,
    marketCap: 33000000000,
    volume24h: 1200000000,
    circulatingSupply: 53000000000,
    sparkline7d: [0.65, 0.64, 0.63, 0.62, 0.61, 0.62, 0.62],
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    rank: 6,
    iconUrl: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    currentPrice: 0.078,
    priceChange1h: -0.8,
    priceChange24h: -1.8,
    priceChange7d: -3.5,
    marketCap: 11000000000,
    volume24h: 450000000,
    circulatingSupply: 141000000000,
    sparkline7d: [0.081, 0.080, 0.079, 0.078, 0.077, 0.078, 0.078],
  },
  {
    id: 'toncoin',
    symbol: 'TON',
    name: 'Toncoin',
    rank: 7,
    iconUrl: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
    currentPrice: 5.42,
    priceChange1h: 0.3,
    priceChange24h: 3.2,
    priceChange7d: 6.8,
    marketCap: 18700000000,
    volume24h: 280000000,
    circulatingSupply: 3450000000,
    sparkline7d: [5.08, 5.15, 5.25, 5.35, 5.40, 5.45, 5.42],
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    rank: 8,
    iconUrl: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    currentPrice: 0.52,
    priceChange1h: 0.2,
    priceChange24h: 1.8,
    priceChange7d: 4.5,
    marketCap: 18200000000,
    volume24h: 450000000,
    circulatingSupply: 35000000000,
    sparkline7d: [0.49, 0.50, 0.51, 0.52, 0.51, 0.52, 0.52],
  },
]

export const marketsRouter = router({
  // Get all markets with filters and sorting
  getAll: publicProcedure
    .input(
      z.object({
        filter: z.enum(['all', 'watchlist', 'holdings']).default('all'),
        sortBy: z.string().default('market_cap_desc'),
        search: z.string().optional(),
        page: z.number().default(1),
        perPage: z.number().default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log('🔍 Fetching markets from CoinGecko API...')
        // Fetch real data from CoinGecko
        let markets = await fetchCoinGeckoMarkets({
          perPage: input.perPage,
          page: input.page,
        })
        console.log('✅ CoinGecko API returned', markets.length, 'markets')
        console.log('📊 First market:', markets[0])

        // Filter by search
        if (input.search) {
          const query = input.search.toLowerCase()
          markets = markets.filter(
            (m) =>
              m.name.toLowerCase().includes(query) ||
              m.symbol.toLowerCase().includes(query)
          )
        }

        // Filter by type
        if (input.filter === 'watchlist' && ctx.user) {
          const { data: watchlist } = await ctx.supabase
            .from('watchlist')
            .select('asset_id')
            .eq('user_id', ctx.user.id)

          const watchlistIds = watchlist?.map((w: any) => w.asset_id) || []
          markets = markets.filter((m) => watchlistIds.includes(m.id))
        } else if (input.filter === 'holdings' && ctx.user) {
          // Get user's assets from positions
          const { data: positions } = await ctx.supabase
            .from('positions')
            .select('asset_id, assets(symbol)')
            .gt('quantity', 0)
            .eq('portfolio_id', ctx.user.id)

          const holdingSymbols =
            positions?.map((p: any) => p.assets?.symbol.toLowerCase()) || []
          markets = markets.filter((m) =>
            holdingSymbols.includes(m.symbol.toLowerCase())
          )
        }

        // Sort
        markets = sortMarkets(markets, input.sortBy)

        // Add user-specific flags
        if (ctx.user) {
          const { data: watchlist } = await ctx.supabase
            .from('watchlist')
            .select('asset_id')
            .eq('user_id', ctx.user.id)

          const watchlistIds = watchlist?.map((w: any) => w.asset_id) || []

          markets = markets.map((m) => ({
            ...m,
            isWatchlisted: watchlistIds.includes(m.id),
            isInPortfolio: false, // TODO: check actual holdings
          }))
        }

        return {
          markets,
          total: markets.length,
          page: input.page,
          perPage: input.perPage,
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch markets from CoinGecko:', error)
        console.error('⚠️ Error details:', {
          message: error?.message,
          cause: error?.cause,
          stack: error?.stack?.split('\n')[0]
        })
        console.error('⚠️ Falling back to MOCK DATA')
        
        // Fallback to mock data on error
        let markets = [...MOCK_MARKET_DATA]
        
        if (input.search) {
          const query = input.search.toLowerCase()
          markets = markets.filter(
            (m) =>
              m.name.toLowerCase().includes(query) ||
              m.symbol.toLowerCase().includes(query)
          )
        }

        markets = sortMarkets(markets, input.sortBy)

        return {
          markets,
          total: markets.length,
          page: input.page,
          perPage: input.perPage,
        }
      }
    }),

  // Get top gainers
  getTopGainers: publicProcedure
    .input(
      z.object({
        limit: z.number().default(5),
        timeframe: z.enum(['1h', '24h', '7d']).default('24h'),
      })
    )
    .query(async ({ input }) => {
      try {
        let markets = await fetchCoinGeckoMarkets({ perPage: 250, page: 1 })

        // Sort by change percentage (descending for gainers)
        markets.sort((a, b) => {
          const aChange =
            input.timeframe === '1h'
              ? a.priceChange1h
              : input.timeframe === '24h'
              ? a.priceChange24h
              : a.priceChange7d
          const bChange =
            input.timeframe === '1h'
              ? b.priceChange1h
              : input.timeframe === '24h'
              ? b.priceChange24h
              : b.priceChange7d
          return bChange - aChange
        })

        return markets.slice(0, input.limit)
      } catch (error) {
        console.error('Failed to fetch top gainers:', error)
        return MOCK_MARKET_DATA.slice(0, input.limit)
      }
    }),

  // Get top losers
  getTopLosers: publicProcedure
    .input(
      z.object({
        limit: z.number().default(5),
        timeframe: z.enum(['1h', '24h', '7d']).default('24h'),
      })
    )
    .query(async ({ input }) => {
      try {
        let markets = await fetchCoinGeckoMarkets({ perPage: 250, page: 1 })

        // Sort by change percentage (ascending for losers)
        markets.sort((a, b) => {
          const aChange =
            input.timeframe === '1h'
              ? a.priceChange1h
              : input.timeframe === '24h'
              ? a.priceChange24h
              : a.priceChange7d
          const bChange =
            input.timeframe === '1h'
              ? b.priceChange1h
              : input.timeframe === '24h'
              ? b.priceChange24h
              : b.priceChange7d
          return aChange - bChange
        })

        return markets.slice(0, input.limit)
      } catch (error) {
        console.error('Failed to fetch top losers:', error)
        return MOCK_MARKET_DATA.slice(0, input.limit)
      }
    }),

  // Toggle watchlist
  toggleWatchlist: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log('🔄 Toggle watchlist for:', input.assetId, 'user:', ctx.user.id)

        // Check if already in watchlist
        const { data: existing, error: selectError } = await ctx.supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', ctx.user.id)
          .eq('asset_id', input.assetId)
          .single()

        if (selectError && selectError.code !== 'PGRST116') {
          // PGRST116 = not found, which is ok
          console.error('❌ Error checking watchlist:', selectError)
          throw new Error('Failed to check watchlist')
        }

        if (existing) {
          // Remove from watchlist
          console.log('➖ Removing from watchlist')
          const { error: deleteError } = await ctx.supabase
            .from('watchlist')
            .delete()
            .eq('user_id', ctx.user.id)
            .eq('asset_id', input.assetId)

          if (deleteError) {
            console.error('❌ Error removing from watchlist:', deleteError)
            throw new Error('Failed to remove from watchlist')
          }

          console.log('✅ Removed from watchlist')
          return { added: false }
        } else {
          // Add to watchlist
          console.log('➕ Adding to watchlist')
          const { error: insertError } = await ctx.supabase
            .from('watchlist')
            .insert({
              user_id: ctx.user.id,
              asset_id: input.assetId,
            })

          if (insertError) {
            console.error('❌ Error adding to watchlist:', insertError)
            throw new Error('Failed to add to watchlist')
          }

          console.log('✅ Added to watchlist')
          return { added: true }
        }
      } catch (error) {
        console.error('❌ Toggle watchlist error:', error)
        throw error
      }
    }),

  // Get watchlist count
  getWatchlistCount: protectedProcedure.query(async ({ ctx }) => {
    const { count } = await ctx.supabase
      .from('watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id)

    return count || 0
  }),

  // Search all cryptocurrencies (including those outside top 100)
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log('Searching for:', input.query)
        
        // Use CoinGecko search API to find ALL coins (not just top 250)
        let results = await searchCoinGecko(input.query)
        console.log('CoinGecko search API results:', results.length)

        // If CoinGecko search returns results, use them
        // Otherwise fallback to searching in top markets
        if (results.length === 0) {
          console.log('No results from search API, trying markets fallback')
          const markets = await fetchCoinGeckoMarkets({ perPage: 250, page: 1 })
          const query = input.query.toLowerCase()
          results = markets
            .filter(m => 
              m.name.toLowerCase().includes(query) || 
              m.symbol.toLowerCase().includes(query) ||
              m.id.toLowerCase().includes(query)
            )
            .map(m => ({
              id: m.id,
              symbol: m.symbol,
              name: m.name,
              market_cap_rank: m.rank,
              thumb: m.iconUrl,
              large: m.iconUrl,
            }))
          console.log('Fallback results from markets:', results.length)
        }
        
        console.log('Total results:', results.length)

        // Get user's watchlist if authenticated
        let watchlistIds: string[] = []
        if (ctx.user) {
          const { data: watchlist } = await ctx.supabase
            .from('watchlist')
            .select('asset_id')
            .eq('user_id', ctx.user.id)

          watchlistIds = watchlist?.map((w: any) => w.asset_id) || []
        }

        // Format results and sort by rank
        const formatted = results
          .map((coin: any) => ({
            id: coin.id,
            symbol: coin.symbol?.toUpperCase() || '',
            name: coin.name,
            rank: coin.market_cap_rank || 999999,
            iconUrl: coin.thumb || coin.large || '',
            isWatchlisted: watchlistIds.includes(coin.id),
          }))
          .sort((a: any, b: any) => a.rank - b.rank) // Sort by rank (lower rank = higher priority)
          .slice(0, 50) // Return top 50 results
        
        console.log('Returning formatted results:', formatted.length)
        return formatted
      } catch (error) {
        console.error('Failed to search coins:', error)
        return []
      }
    }),

  // Get portfolio holdings for a specific coin by CoinGecko ID
  getCoinHoldings: protectedProcedure
    .input(
      z.object({
        coinId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log('🔍 Looking for asset with coinId:', input.coinId)
        
        // Find asset by CoinGecko ID or symbol (case-insensitive)
        let asset = null
        
        // Try by coingecko_id first
        const { data: assetByCoinGeckoId, error: coinGeckoError } = await ctx.supabase
          .from('assets')
          .select('id, symbol, name, coingecko_id')
          .eq('coingecko_id', input.coinId)
          .maybeSingle()

        console.log('Search by coingecko_id:', { assetByCoinGeckoId, coinGeckoError })

        if (assetByCoinGeckoId) {
          asset = assetByCoinGeckoId
        } else {
          // Try by symbol (case-insensitive)
          const { data: assetBySymbol, error: symbolError } = await ctx.supabase
            .from('assets')
            .select('id, symbol, name, coingecko_id')
            .ilike('symbol', input.coinId)
            .maybeSingle()
          
          console.log('Search by symbol:', { assetBySymbol, symbolError })
          
          if (assetBySymbol) {
            asset = assetBySymbol
          } else {
            // Try by name (case-insensitive) as last resort
            const { data: assetByName, error: nameError } = await ctx.supabase
              .from('assets')
              .select('id, symbol, name, coingecko_id')
              .ilike('name', input.coinId)
              .maybeSingle()
            
            console.log('Search by name:', { assetByName, nameError })
            asset = assetByName
          }
        }

        if (!asset) {
          console.log('❌ Asset not found for coinId:', input.coinId)
          return null
        }

        console.log('✅ Found asset:', asset)

        // Get all user's portfolios
        const { data: portfolios } = await ctx.supabase
          .from('portfolios')
          .select('id, name')
          .eq('user_id', ctx.user.id)

        if (!portfolios || portfolios.length === 0) {
          console.log('❌ No portfolios found for user')
          return null
        }

        const portfolioIds = portfolios.map(p => p.id)

        // Get all transactions for this asset across all portfolios
        const { data: txs } = await ctx.supabase
          .from('transactions')
          .select('*')
          .eq('asset_id', asset.id)
          .in('portfolio_id', portfolioIds)
          .order('timestamp', { ascending: true })

        if (!txs || txs.length === 0) {
          console.log('❌ No transactions found for asset')
          return null
        }

        // Calculate holdings per portfolio
        const portfolioHoldings: Record<string, { quantity: number; totalCost: number; portfolioId: string; portfolioName: string }> = {}

        for (const portfolio of portfolios) {
          portfolioHoldings[portfolio.id] = {
            quantity: 0,
            totalCost: 0,
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
          }
        }

        // Process transactions to calculate current holdings
        for (const tx of txs) {
          const holding = portfolioHoldings[tx.portfolio_id]
          if (!holding) continue

          if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop') {
            holding.quantity += Number(tx.quantity)
            holding.totalCost += Number(tx.quantity) * Number(tx.price) + (Number(tx.fee) || 0)
          } else if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
            const avgPrice = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0
            const costBasis = Number(tx.quantity) * avgPrice
            
            holding.quantity -= Number(tx.quantity)
            holding.totalCost -= costBasis
          }
        }

        // Filter portfolios with holdings and calculate totals
        const portfoliosWithHoldings = Object.values(portfolioHoldings).filter(h => h.quantity > 0)

        if (portfoliosWithHoldings.length === 0) {
          console.log('❌ No current holdings found')
          return null
        }

        const totalQuantity = portfoliosWithHoldings.reduce((sum, h) => sum + h.quantity, 0)
        const totalInvested = portfoliosWithHoldings.reduce((sum, h) => sum + h.totalCost, 0)
        const avgBuyPrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0

        console.log('✅ Holdings calculated:', { totalQuantity, avgBuyPrice, portfoliosCount: portfoliosWithHoldings.length })

        return {
          assetId: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          totalQuantity,
          avgBuyPrice,
          totalInvested,
          portfolios: portfoliosWithHoldings.map((h) => ({
            id: h.portfolioId,
            name: h.portfolioName,
            quantity: h.quantity,
            avgBuyPrice: h.quantity > 0 ? h.totalCost / h.quantity : 0,
            totalInvested: h.totalCost,
          })),
        }
      } catch (error) {
        console.error('Failed to get coin holdings:', error)
        return null
      }
    }),

  // Get price history with user transactions for chart
  getPriceHistory: protectedProcedure
    .input(
      z.object({
        coinId: z.string(),
        days: z.number().default(7), // 1, 7, 30, 90, 365
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Find asset
        let asset = null
        
        const { data: assetByCoinGeckoId } = await ctx.supabase
          .from('assets')
          .select('id, symbol, name, coingecko_id')
          .eq('coingecko_id', input.coinId)
          .maybeSingle()

        if (assetByCoinGeckoId) {
          asset = assetByCoinGeckoId
        } else {
          const { data: assetBySymbol } = await ctx.supabase
            .from('assets')
            .select('id, symbol, name, coingecko_id')
            .ilike('symbol', input.coinId)
            .maybeSingle()
          
          asset = assetBySymbol
        }

        if (!asset) {
          return { prices: [], transactions: [] }
        }

        // Get user's portfolios
        const { data: portfolios } = await ctx.supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', ctx.user.id)

        const portfolioIds = portfolios?.map(p => p.id) || []

        // Get user transactions for this asset
        const { data: transactions } = await ctx.supabase
          .from('transactions')
          .select('*')
          .eq('asset_id', asset.id)
          .in('portfolio_id', portfolioIds)
          .order('timestamp', { ascending: true })

        // Get historical prices from CoinGecko
        const coingeckoId = asset.coingecko_id
        if (!coingeckoId) {
          return {
            prices: [],
            transactions: (transactions || []).map(tx => ({
              timestamp: tx.timestamp,
              type: tx.type,
              quantity: Number(tx.quantity),
              price: Number(tx.price),
              fee: Number(tx.fee || 0),
            })),
          }
        }

        try {
          const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${input.days}&interval=${input.days === 1 ? 'hourly' : 'daily'}`
          console.log('🔍 Fetching CoinGecko data:', { coingeckoId, days: input.days, url })
          
          // Call CoinGecko market_chart API
          const response = await fetch(url)

          if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ CoinGecko API error:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            })
            return {
              prices: [],
              transactions: (transactions || []).map(tx => ({
                timestamp: tx.timestamp,
                type: tx.type,
                quantity: Number(tx.quantity),
                price: Number(tx.price),
                fee: Number(tx.fee || 0),
              })),
            }
          }

          const data = await response.json() as { prices?: [number, number][] }
          console.log('✅ CoinGecko response:', {
            pricesCount: data.prices?.length || 0,
            firstPrice: data.prices?.[0],
            lastPrice: data.prices?.[data.prices.length - 1]
          })
          
          // CoinGecko returns: { prices: [[timestamp, price], ...] }
          const prices = (data.prices || []).map(([timestamp, price]) => ({
            timestamp,
            price,
          }))

          console.log('📊 Processed prices:', {
            count: prices.length,
            first: prices[0],
            last: prices[prices.length - 1]
          })

          return {
            prices,
            transactions: (transactions || []).map(tx => ({
              timestamp: tx.timestamp,
              type: tx.type,
              quantity: Number(tx.quantity),
              price: Number(tx.price),
              fee: Number(tx.fee || 0),
            })),
          }
        } catch (error) {
          console.error('Failed to fetch CoinGecko data:', error)
          return {
            prices: [],
            transactions: (transactions || []).map(tx => ({
              timestamp: tx.timestamp,
              type: tx.type,
              quantity: Number(tx.quantity),
              price: Number(tx.price),
              fee: Number(tx.fee || 0),
            })),
          }
        }
      } catch (error) {
        console.error('Failed to get price history:', error)
        return { prices: [], transactions: [] }
      }
    }),
})

// Helper function to sort markets
function sortMarkets(markets: any[], sortBy: string) {
  const [field, direction] = sortBy.split('_')

  return markets.sort((a, b) => {
    let aVal, bVal

    switch (field) {
      case 'market':
        aVal = a.marketCap
        bVal = b.marketCap
        break
      case 'price':
        aVal = a.currentPrice
        bVal = b.currentPrice
        break
      case 'change':
        aVal = a.priceChange24h
        bVal = b.priceChange24h
        break
      case 'volume':
        aVal = a.volume24h
        bVal = b.volume24h
        break
      default:
        aVal = a.marketCap
        bVal = b.marketCap
    }

    if (direction === 'desc') {
      return bVal - aVal
    } else {
      return aVal - bVal
    }
  })
}
