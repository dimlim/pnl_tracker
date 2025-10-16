import { z } from 'zod'
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from '../context'
import superjson from 'superjson'

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
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    rank: 5,
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
      // Start with mock data
      let markets = [...MOCK_MARKET_DATA]

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

        const watchlistIds = watchlist?.map((w) => w.asset_id) || []
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

        const watchlistIds = watchlist?.map((w) => w.asset_id) || []

        markets = markets.map((m) => ({
          ...m,
          isWatchlisted: watchlistIds.includes(m.id),
          isInPortfolio: false, // TODO: check actual holdings
        }))
      }

      // Pagination
      const start = (input.page - 1) * input.perPage
      const end = start + input.perPage
      const paginatedMarkets = markets.slice(start, end)

      return {
        markets: paginatedMarkets,
        total: markets.length,
        page: input.page,
        perPage: input.perPage,
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
      let markets = [...MOCK_MARKET_DATA]

      // Sort by change percentage
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

      return markets.slice(0, input.limit).map((m) => ({
        ...m,
        priceChangePercent24h: m.priceChange24h,
      }))
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
      let markets = [...MOCK_MARKET_DATA]

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

      return markets.slice(0, input.limit).map((m) => ({
        ...m,
        priceChangePercent24h: m.priceChange24h,
      }))
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
