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
        // Fetch real data from CoinGecko
        let markets = await fetchCoinGeckoMarkets({
          perPage: input.perPage,
          page: input.page,
        })

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
      } catch (error) {
        console.error('Failed to fetch markets:', error)
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
      // Check if already in watchlist
      const { data: existing } = await ctx.supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', ctx.user.id)
        .eq('asset_id', input.assetId)
        .single()

      if (existing) {
        // Remove from watchlist
        await ctx.supabase
          .from('watchlist')
          .delete()
          .eq('user_id', ctx.user.id)
          .eq('asset_id', input.assetId)

        return { added: false }
      } else {
        // Add to watchlist
        await ctx.supabase.from('watchlist').insert({
          user_id: ctx.user.id,
          asset_id: input.assetId,
        })

        return { added: true }
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
        // Use CoinGecko search API to find all coins
        const results = await searchCoinGecko(input.query)

        // Get user's watchlist if authenticated
        let watchlistIds: string[] = []
        if (ctx.user) {
          const { data: watchlist } = await ctx.supabase
            .from('watchlist')
            .select('asset_id')
            .eq('user_id', ctx.user.id)

          watchlistIds = watchlist?.map((w: any) => w.asset_id) || []
        }

        // Format results
        return results.slice(0, 20).map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol?.toUpperCase() || '',
          name: coin.name,
          rank: coin.market_cap_rank || 999999,
          iconUrl: coin.thumb || coin.large || '',
          isWatchlisted: watchlistIds.includes(coin.id),
        }))
      } catch (error) {
        console.error('Failed to search coins:', error)
        return []
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
