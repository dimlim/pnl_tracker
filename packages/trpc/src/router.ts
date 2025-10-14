import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { Context } from './context'
import type { Portfolio, Transaction, Asset } from '@crypto-pnl/types'
import { computePnL } from '@crypto-pnl/pnl-engine'
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

const protectedProcedure = t.procedure.use(isAuthed)

export const appRouter = t.router({
  // Health check
  health: t.procedure.query(() => ({ ok: true, timestamp: new Date() })),

  // Assets
  assets: t.router({
    list: t.procedure.query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from('assets')
        .select('*')
        .order('symbol', { ascending: true })

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      return data as Asset[]
    }),

    search: t.procedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('assets')
          .select('*')
          .or(`symbol.ilike.%${input.query}%,name.ilike.%${input.query}%`)
          .limit(10)

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return data as Asset[]
      }),

    getById: t.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('assets')
          .select('*')
          .eq('id', input.id)
          .single()

        if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' })
        return data as Asset
      }),

    getStats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        // Get all user's portfolios
        const { data: portfolios } = await ctx.supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', ctx.user.id)

        if (!portfolios || portfolios.length === 0) {
          return {
            totalQuantity: 0,
            avgBuyPrice: 0,
            totalPnL: 0,
            pnlPercent: 0,
            transactionCount: 0,
            realizedPnL: 0,
            unrealizedPnL: 0,
            breakEvenPrice: 0,
          }
        }

        const portfolioIds = portfolios.map(p => p.id)

        // Get all transactions for this asset across all portfolios
        const { data: txs } = await ctx.supabase
          .from('transactions')
          .select('*')
          .eq('asset_id', input.id)
          .in('portfolio_id', portfolioIds)
          .order('timestamp', { ascending: true })

        if (!txs || txs.length === 0) {
          return {
            totalQuantity: 0,
            avgBuyPrice: 0,
            totalPnL: 0,
            pnlPercent: 0,
            transactionCount: 0,
            realizedPnL: 0,
            unrealizedPnL: 0,
            breakEvenPrice: 0,
          }
        }

        // Calculate stats with FIFO method
        let totalQuantity = 0
        let totalCost = 0
        let totalBought = 0
        let totalBoughtCost = 0
        let realizedPnL = 0

        for (const tx of txs) {
          if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop') {
            totalQuantity += tx.quantity
            totalCost += tx.quantity * tx.price + (tx.fee || 0)
            totalBought += tx.quantity
            totalBoughtCost += tx.quantity * tx.price + (tx.fee || 0)
          } else if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
            const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
            const soldValue = tx.quantity * tx.price - (tx.fee || 0)
            const costBasis = tx.quantity * avgPrice
            realizedPnL += soldValue - costBasis
            
            totalQuantity -= tx.quantity
            totalCost -= costBasis
          }
        }

        // Get current price
        const { data: asset } = await ctx.supabase
          .from('assets')
          .select('current_price')
          .eq('id', input.id)
          .single()

        const currentPrice = asset?.current_price || 0
        const currentValue = totalQuantity * currentPrice
        const avgBuyPrice = totalBought > 0 ? totalBoughtCost / totalBought : 0
        const unrealizedPnL = currentValue - totalCost
        const totalPnL = realizedPnL + unrealizedPnL
        const pnlPercent = totalBoughtCost > 0 ? (totalPnL / totalBoughtCost) * 100 : 0
        
        // Break-even price = total cost / total quantity
        const breakEvenPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0

        return {
          totalQuantity,
          avgBuyPrice,
          totalPnL,
          pnlPercent,
          transactionCount: txs.length,
          realizedPnL,
          unrealizedPnL,
          breakEvenPrice,
        }
      }),

    getPriceHistory: t.procedure
      .input(z.object({ id: z.number(), days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const daysAgo = new Date()
        daysAgo.setDate(daysAgo.getDate() - input.days)

        const { data, error } = await ctx.supabase
          .from('price_ticks')
          .select('*')
          .eq('asset_id', input.id)
          .gte('ts', daysAgo.toISOString())
          .order('ts', { ascending: false })
          .limit(100)

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return data || []
      }),

    getUserTransactions: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        // Get all user's portfolios
        const { data: portfolios } = await ctx.supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', ctx.user.id)

        if (!portfolios || portfolios.length === 0) {
          return []
        }

        const portfolioIds = portfolios.map(p => p.id)

        // Get transactions
        const { data, error } = await ctx.supabase
          .from('transactions')
          .select('*')
          .eq('asset_id', input.id)
          .in('portfolio_id', portfolioIds)
          .order('timestamp', { ascending: false })

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return data || []
      }),
  }),

  // Portfolios
  portfolios: t.router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      return data as Portfolio[]
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { data, error} = await ctx.supabase
          .from('portfolios')
          .select('*')
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .single()

        if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio not found' })
        return data as Portfolio
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('portfolios')
          .select('*')
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .single()

        if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio not found' })
        return data as Portfolio
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          base_currency: z.string().default('USD'),
          pnl_method: z.enum(['fifo', 'lifo', 'avg']),
          include_fees: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('portfolios')
          .insert({
            user_id: ctx.user.id,
            name: input.name,
            base_currency: input.base_currency,
            pnl_method: input.pnl_method,
            include_fees: input.include_fees,
          })
          .select()
          .single()

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return data as Portfolio
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1).max(100).optional(),
          pnl_method: z.enum(['fifo', 'lifo', 'avg']).optional(),
          include_fees: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input
        const { data, error } = await ctx.supabase
          .from('portfolios')
          .update(updates)
          .eq('id', id)
          .eq('user_id', ctx.user.id)
          .select()
          .single()

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return data as Portfolio
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await ctx.supabase
          .from('portfolios')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return { success: true }
      }),
  }),

  // Positions
  positions: t.router({
    list: protectedProcedure
      .input(z.object({ portfolio_id: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get all transactions for this portfolio
        const { data: transactions, error: txError } = await ctx.supabase
          .from('transactions')
          .select('*, assets(*)')
          .eq('portfolio_id', input.portfolio_id)
          .order('timestamp', { ascending: true })

        if (txError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: txError.message })
        if (!transactions || transactions.length === 0) return []

        // Calculate positions from transactions
        const positionsMap = new Map<number, {
          asset_id: number
          quantity: number
          total_cost: number
          assets: any
        }>()

        for (const tx of transactions) {
          const existing = positionsMap.get(tx.asset_id) || {
            asset_id: tx.asset_id,
            quantity: 0,
            total_cost: 0,
            assets: tx.assets,
          }

          if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop') {
            existing.quantity += tx.quantity
            existing.total_cost += tx.quantity * tx.price + (tx.fee || 0)
          } else if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
            const avgPrice = existing.quantity > 0 ? existing.total_cost / existing.quantity : 0
            existing.quantity -= tx.quantity
            existing.total_cost -= tx.quantity * avgPrice
          }

          positionsMap.set(tx.asset_id, existing)
        }

        // Filter out zero positions and format
        const positions = Array.from(positionsMap.values())
          .filter(p => p.quantity > 0.00000001)
          .map(p => ({
            id: p.asset_id,
            portfolio_id: input.portfolio_id,
            asset_id: p.asset_id,
            quantity: p.quantity,
            avg_price: p.total_cost / p.quantity,
            assets: p.assets,
          }))
          .sort((a, b) => b.quantity * b.avg_price - a.quantity * a.avg_price)

        return positions
      }),
  }),

  // Transactions
  transactions: t.router({
    list: protectedProcedure
      .input(z.object({ portfolio_id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('transactions')
          .select('*, assets(*)')
          .eq('portfolio_id', input.portfolio_id)
          .order('timestamp', { ascending: false })

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return data as (Transaction & { assets: Asset })[]
      }),

    create: protectedProcedure
      .input(
        z.object({
          portfolio_id: z.string().uuid(),
          asset_id: z.number(),
          type: z.enum(['buy', 'sell', 'transfer_in', 'transfer_out', 'deposit', 'withdraw', 'airdrop']),
          quantity: z.number().positive(),
          price: z.number().nonnegative(),
          fee: z.number().nonnegative().optional(),
          timestamp: z.string().or(z.date()),
          note: z.string().optional(),
          tx_hash: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify portfolio ownership
        const { data: portfolio } = await ctx.supabase
          .from('portfolios')
          .select('id')
          .eq('id', input.portfolio_id)
          .eq('user_id', ctx.user.id)
          .single()

        if (!portfolio) throw new TRPCError({ code: 'FORBIDDEN', message: 'Portfolio not found' })

        const { data, error } = await ctx.supabase
          .from('transactions')
          .insert(input)
          .select()
          .single()

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return data as Transaction
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await ctx.supabase
          .from('transactions')
          .delete()
          .eq('id', input.id)

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return { success: true }
      }),
  }),

  // PnL calculations
  pnl: t.router({
    calculate: protectedProcedure
      .input(
        z.object({
          portfolio_id: z.string().uuid(),
          asset_id: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        // Get portfolio settings
        const { data: portfolio } = await ctx.supabase
          .from('portfolios')
          .select('*')
          .eq('id', input.portfolio_id)
          .eq('user_id', ctx.user.id)
          .single()

        if (!portfolio) throw new TRPCError({ code: 'NOT_FOUND' })

        // Get transactions
        let query = ctx.supabase
          .from('transactions')
          .select('*')
          .eq('portfolio_id', input.portfolio_id)

        if (input.asset_id) {
          query = query.eq('asset_id', input.asset_id)
        }

        const { data: transactions } = await query

        if (!transactions) return { realized: 0, quantity: 0, avgPrice: 0 }

        // Calculate PnL
        const result = computePnL(
          transactions as Transaction[],
          portfolio.pnl_method as 'fifo' | 'lifo' | 'avg',
          portfolio.include_fees
        )

        return result
      }),
  }),

  // Dashboard
  dashboard: t.router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      try {
        console.log('[Dashboard] Fetching stats for user:', ctx.user?.id)
        
        if (!ctx.user?.id) {
          console.log('[Dashboard] No user ID, returning zeros')
          return {
            totalValue: 0,
            totalPnL: 0,
            pnlPercentage: 0,
            portfolioCount: 0,
            recentTransactions: [],
            topPerformers: [],
          }
        }
        
        // Get all portfolios for user
        const { data: portfolios, error: portfoliosError } = await ctx.supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', ctx.user.id)

        console.log('[Dashboard] Portfolios found:', portfolios?.length || 0)

        if (portfoliosError) {
          console.error('[Dashboard] Portfolios error:', portfoliosError)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: portfoliosError.message })
        }
        
        if (!portfolios || portfolios.length === 0) {
          console.log('[Dashboard] No portfolios, returning zeros')
          return {
            totalValue: 0,
            totalPnL: 0,
            pnlPercentage: 0,
            portfolioCount: 0,
            recentTransactions: [],
            topPerformers: [],
          }
        }

        const portfolioIds = portfolios.map(p => p.id)
        console.log('[Dashboard] Portfolio IDs:', portfolioIds)

        // Get all transactions to calculate positions
        const { data: allTransactions, error: txError } = await ctx.supabase
          .from('transactions')
          .select('*, assets(*)')
          .in('portfolio_id', portfolioIds)
          .order('timestamp', { ascending: true })

        console.log('[Dashboard] Transactions found:', allTransactions?.length || 0)

        if (txError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: txError.message })

        // Calculate positions from transactions
        const positionsMap = new Map<number, {
          asset_id: number
          quantity: number
          total_cost: number
          assets: any
        }>()

        allTransactions?.forEach((tx: any) => {
          const existing = positionsMap.get(tx.asset_id) || {
            asset_id: tx.asset_id,
            quantity: 0,
            total_cost: 0,
            assets: tx.assets,
          }

          if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop') {
            existing.quantity += tx.quantity
            existing.total_cost += tx.quantity * tx.price + (tx.fee || 0)
          } else if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
            const avgPrice = existing.quantity > 0 ? existing.total_cost / existing.quantity : 0
            existing.quantity -= tx.quantity
            existing.total_cost -= tx.quantity * avgPrice
          }

          positionsMap.set(tx.asset_id, existing)
        })

        // Calculate total value and P&L
        let totalValue = 0
        let totalCost = 0
        const performersMap = new Map<string, { asset: any, value: number, pnl: number, pnlPercent: number }>()

        positionsMap.forEach((pos) => {
          if (pos.quantity <= 0.00000001) return // Skip zero positions

          const currentPrice = pos.assets?.current_price || 0
          const avgPrice = pos.total_cost / pos.quantity
          const value = pos.quantity * currentPrice
          const cost = pos.quantity * avgPrice
          const pnl = value - cost
          const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0

          totalValue += value
          totalCost += cost

          // Track per asset for top performers
          const assetKey = pos.asset_id.toString()
          if (performersMap.has(assetKey)) {
            const existing = performersMap.get(assetKey)!
            existing.value += value
            existing.pnl += pnl
            existing.pnlPercent = existing.value > 0 ? (existing.pnl / (existing.value - existing.pnl)) * 100 : 0
          } else {
            performersMap.set(assetKey, {
              asset: pos.assets,
              value,
              pnl,
              pnlPercent,
            })
          }
        })

        const totalPnL = totalValue - totalCost
        const pnlPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

        // Get top 5 performers by P&L percentage
        const topPerformers = Array.from(performersMap.values())
          .sort((a, b) => b.pnlPercent - a.pnlPercent)
          .slice(0, 5)
          .map(p => ({
            ...p.asset,
            pnl: p.pnl,
            pnlPercent: p.pnlPercent,
            value: p.value,
          }))

        // Get recent transactions
        const { data: recentTxs, error: transactionsError } = await ctx.supabase
          .from('transactions')
          .select('*, assets(*)')
          .in('portfolio_id', portfolioIds)
          .order('timestamp', { ascending: false })
          .limit(5)

        if (transactionsError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: transactionsError.message })

        return {
          totalValue,
          totalPnL,
          pnlPercentage,
          portfolioCount: portfolios.length,
          recentTransactions: recentTxs || [],
          topPerformers,
        }
      } catch (error) {
        console.error('[Dashboard] Unexpected error:', error)
        return {
          totalValue: 0,
          totalPnL: 0,
          pnlPercentage: 0,
          portfolioCount: 0,
          recentTransactions: [],
          topPerformers: [],
        }
      }
    }),
  }),
})

export type AppRouter = typeof appRouter
