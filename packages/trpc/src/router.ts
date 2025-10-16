import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import { format } from 'date-fns'
import type { Context } from './context'
import type { Portfolio, Transaction, Asset } from '@crypto-pnl/types'
import { computePnL } from '@crypto-pnl/pnl-engine'
import { calculatePortfolioHistory, fetchHistoricalPricesFromCoinGecko } from '@crypto-pnl/pnl-engine/src/history'
import superjson from 'superjson'
import { marketsRouter } from './routers/markets'

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
            avgHoldingDays: 0,
            athPrice: 0,
            distanceToATH: 0,
            positionSize: 0,
            totalPortfolioValue: 0,
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
            avgHoldingDays: 0,
            athPrice: 0,
            distanceToATH: 0,
            positionSize: 0,
            totalPortfolioValue: 0,
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
        
        // Calculate average holding time for buy transactions
        const buyTxs = txs.filter(tx => 
          tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop'
        )
        let avgHoldingDays = 0
        if (buyTxs.length > 0) {
          const now = new Date()
          const totalDays = buyTxs.reduce((sum, tx) => {
            const txDate = new Date(tx.timestamp)
            const days = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))
            return sum + days
          }, 0)
          avgHoldingDays = Math.floor(totalDays / buyTxs.length)
        }
        
        // Get ATH (All-Time High) from price history
        const { data: priceHistory } = await ctx.supabase
          .from('price_ticks')
          .select('price')
          .eq('asset_id', input.id)
          .order('price', { ascending: false })
          .limit(1)
        
        const athPrice = priceHistory?.[0]?.price || currentPrice
        const distanceToATH = athPrice > 0 ? ((currentPrice - athPrice) / athPrice) * 100 : 0
        
        // Calculate total portfolio value for position size %
        // Get all transactions across all user's portfolios
        const { data: allUserTxs } = await ctx.supabase
          .from('transactions')
          .select('*, assets(current_price)')
          .in('portfolio_id', portfolioIds)
          .order('timestamp', { ascending: true })
        
        // Calculate total portfolio value
        const portfolioPositions = new Map<number, { quantity: number, currentPrice: number }>()
        
        allUserTxs?.forEach((tx: any) => {
          const existing = portfolioPositions.get(tx.asset_id) || { quantity: 0, currentPrice: tx.assets?.current_price || 0 }
          
          if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop') {
            existing.quantity += tx.quantity
          } else if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
            existing.quantity -= tx.quantity
          }
          
          portfolioPositions.set(tx.asset_id, existing)
        })
        
        let totalPortfolioValue = 0
        portfolioPositions.forEach(pos => {
          if (pos.quantity > 0) {
            totalPortfolioValue += pos.quantity * pos.currentPrice
          }
        })
        
        const positionSize = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0

        return {
          totalQuantity,
          avgBuyPrice,
          totalPnL,
          pnlPercent,
          transactionCount: txs.length,
          realizedPnL,
          unrealizedPnL,
          breakEvenPrice,
          avgHoldingDays,
          athPrice,
          distanceToATH,
          positionSize,
          totalPortfolioValue,
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

    listWithStats: protectedProcedure.query(async ({ ctx }) => {
      const { data: portfolios, error } = await ctx.supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      if (!portfolios) return []

      // Get stats for each portfolio
      const portfoliosWithStats = await Promise.all(
        portfolios.map(async (portfolio) => {
          // Get all transactions for this portfolio
          const { data: transactions } = await ctx.supabase
            .from('transactions')
            .select('*, assets(current_price)')
            .eq('portfolio_id', portfolio.id)
            .order('timestamp', { ascending: true })

          if (!transactions || transactions.length === 0) {
            return {
              ...portfolio,
              stats: {
                totalValue: 0,
                totalPnL: 0,
                pnlPercent: 0,
                assetCount: 0,
              },
            }
          }

          // Calculate positions
          const positions = new Map<number, { quantity: number; totalCost: number; currentPrice: number }>()
          
          transactions.forEach((tx: any) => {
            const existing = positions.get(tx.asset_id) || {
              quantity: 0,
              totalCost: 0,
              currentPrice: tx.assets?.current_price || 0,
            }

            if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop') {
              existing.quantity += tx.quantity
              existing.totalCost += tx.quantity * tx.price + (tx.fee || 0)
            } else if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
              const avgPrice = existing.quantity > 0 ? existing.totalCost / existing.quantity : 0
              existing.quantity -= tx.quantity
              existing.totalCost -= tx.quantity * avgPrice
            }

            existing.currentPrice = tx.assets?.current_price || existing.currentPrice
            positions.set(tx.asset_id, existing)
          })

          // Calculate totals and get top assets
          let totalValue = 0
          let totalCost = 0
          let assetCount = 0
          const assetValues: Array<{ assetId: number; value: number; symbol: string }> = []

          positions.forEach((pos, assetId) => {
            if (pos.quantity > 0) {
              const value = pos.quantity * pos.currentPrice
              totalValue += value
              totalCost += pos.totalCost
              assetCount++
              
              // Find asset symbol
              const assetTx = transactions.find((tx: any) => tx.asset_id === assetId)
              if (assetTx) {
                assetValues.push({
                  assetId,
                  value,
                  symbol: assetTx.assets?.symbol || 'UNKNOWN',
                })
              }
            }
          })

          // Sort by value and get top 3
          const topAssets = assetValues
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
            .map(a => ({ symbol: a.symbol }))

          const totalPnL = totalValue - totalCost
          const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

          return {
            ...portfolio,
            stats: {
              totalValue,
              totalPnL,
              pnlPercent,
              assetCount,
            },
            topAssets,
          }
        })
      )

      return portfoliosWithStats
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

    duplicate: protectedProcedure
      .input(z.object({ 
        id: z.string().uuid(),
        newName: z.string(),
        copyTransactions: z.boolean().default(true)
      }))
      .mutation(async ({ ctx, input }) => {
        // Get original portfolio
        const { data: original, error: fetchError } = await ctx.supabase
          .from('portfolios')
          .select('*')
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .single()

        if (fetchError || !original) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio not found' })
        }

        // Create new portfolio
        const { data: newPortfolio, error: createError } = await ctx.supabase
          .from('portfolios')
          .insert({
            user_id: ctx.user.id,
            name: input.newName,
            base_currency: original.base_currency,
            pnl_method: original.pnl_method,
            include_fees: original.include_fees,
          })
          .select()
          .single()

        if (createError || !newPortfolio) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create portfolio' })
        }

        // Copy transactions if requested
        if (input.copyTransactions) {
          const { data: transactions, error: txError } = await ctx.supabase
            .from('transactions')
            .select('*')
            .eq('portfolio_id', input.id)

          if (!txError && transactions && transactions.length > 0) {
            const newTransactions = transactions.map(tx => ({
              portfolio_id: newPortfolio.id,
              asset_id: tx.asset_id,
              type: tx.type,
              quantity: tx.quantity,
              price: tx.price,
              fee: tx.fee,
              timestamp: tx.timestamp,
              note: tx.note,
            }))

            await ctx.supabase
              .from('transactions')
              .insert(newTransactions)
          }
        }

        return newPortfolio as Portfolio
      }),

    getHistory: protectedProcedure
      .input(z.object({
        portfolioId: z.string().uuid(),
        days: z.number().min(1).max(365).default(7),
        interval: z.enum(['daily', 'hourly']).default('daily'),
      }))
      .query(async ({ ctx, input }) => {
        // Get portfolio to verify ownership and get method
        const { data: portfolio, error: portfolioError } = await ctx.supabase
          .from('portfolios')
          .select('*')
          .eq('id', input.portfolioId)
          .eq('user_id', ctx.user.id)
          .single()

        if (portfolioError || !portfolio) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio not found' })
        }

        // Get all transactions for this portfolio
        const { data: transactions, error: txError } = await ctx.supabase
          .from('transactions')
          .select('*, assets(symbol, coingecko_id)')
          .eq('portfolio_id', input.portfolioId)
          .order('timestamp', { ascending: true })

        if (txError) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: txError.message })
        }

        if (!transactions || transactions.length === 0) {
          // Return empty history
          return []
        }

        // Get unique assets
        const { data: assets, error: assetsError } = await ctx.supabase
          .from('assets')
          .select('id, symbol, coingecko_id')
          .in('id', Array.from(new Set(transactions.map((tx: any) => tx.asset_id))))

        if (assetsError) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: assetsError.message })
        }

        // Create price fetcher function
        const getHistoricalPrices = async (date: Date, assetIds: number[]) => {
          const assetsToFetch = (assets || []).filter((a: any) => assetIds.includes(a.id))
          return await fetchHistoricalPricesFromCoinGecko(date, assetsToFetch)
        }

        // Calculate history
        const history = await calculatePortfolioHistory(
          transactions.map((tx: any) => ({
            id: tx.id,
            asset_id: tx.asset_id,
            type: tx.type,
            quantity: tx.quantity,
            price: tx.price,
            fee: tx.fee || 0,
            timestamp: new Date(tx.timestamp),
          })),
          input.days,
          portfolio.pnl_method as 'fifo' | 'lifo' | 'avg',
          getHistoricalPrices
        )

        return history
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

    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        // Get user's portfolios
        const { data: portfolios } = await ctx.supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', ctx.user.id)

        if (!portfolios || portfolios.length === 0) return []

        const portfolioIds = portfolios.map(p => p.id)

        // Get all transactions for user's portfolios
        const { data, error } = await ctx.supabase
          .from('transactions')
          .select('*, assets(*), portfolios(name)')
          .in('portfolio_id', portfolioIds)
          .order('timestamp', { ascending: false })

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return data as (Transaction & { assets: Asset, portfolios: { name: string } })[]
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

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          quantity: z.number().positive().optional(),
          price: z.number().nonnegative().optional(),
          fee: z.number().nonnegative().optional(),
          timestamp: z.string().or(z.date()).optional(),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input
        
        // Verify transaction ownership through portfolio
        const { data: transaction } = await ctx.supabase
          .from('transactions')
          .select('portfolio_id, portfolios!inner(user_id)')
          .eq('id', id)
          .single()

        if (!transaction || (transaction as any).portfolios.user_id !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Transaction not found' })
        }

        const { data, error } = await ctx.supabase
          .from('transactions')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return data as Transaction
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership before delete
        const { data: transaction } = await ctx.supabase
          .from('transactions')
          .select('portfolio_id, portfolios!inner(user_id)')
          .eq('id', input.id)
          .single()

        if (!transaction || (transaction as any).portfolios.user_id !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Transaction not found' })
        }

        const { error } = await ctx.supabase
          .from('transactions')
          .delete()
          .eq('id', input.id)

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return { success: true }
      }),

    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        if (input.ids.length === 0) {
          return { success: true, count: 0 }
        }

        // Verify all transactions belong to user
        const { data: transactions } = await ctx.supabase
          .from('transactions')
          .select('id, portfolio_id, portfolios!inner(user_id)')
          .in('id', input.ids)

        const userTransactionIds = transactions
          ?.filter((tx: any) => tx.portfolios.user_id === ctx.user.id)
          .map((tx: any) => tx.id) || []

        if (userTransactionIds.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No valid transactions to delete' })
        }

        const { error, count } = await ctx.supabase
          .from('transactions')
          .delete()
          .in('id', userTransactionIds)

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return { success: true, count: count || 0 }
      }),

    bulkMove: protectedProcedure
      .input(z.object({ 
        ids: z.array(z.number()),
        targetPortfolioId: z.string().uuid()
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.ids.length === 0) {
          return { success: true, count: 0 }
        }

        // Verify target portfolio belongs to user
        const { data: targetPortfolio } = await ctx.supabase
          .from('portfolios')
          .select('id')
          .eq('id', input.targetPortfolioId)
          .eq('user_id', ctx.user.id)
          .single()

        if (!targetPortfolio) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Target portfolio not found' })
        }

        // Verify all transactions belong to user
        const { data: transactions } = await ctx.supabase
          .from('transactions')
          .select('id, portfolio_id, portfolios!inner(user_id)')
          .in('id', input.ids)

        const userTransactionIds = transactions
          ?.filter((tx: any) => tx.portfolios.user_id === ctx.user.id)
          .map((tx: any) => tx.id) || []

        if (userTransactionIds.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No valid transactions to move' })
        }

        // Move transactions to target portfolio
        const { error, count } = await ctx.supabase
          .from('transactions')
          .update({ portfolio_id: input.targetPortfolioId })
          .in('id', userTransactionIds)

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return { success: true, count: count || 0 }
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
    getPortfolioHistory: protectedProcedure
      .input(
        z.object({
          timeframe: z.enum(['1D', '1W', '1M', '3M', '1Y', 'ALL']).default('1M'),
          granularity: z.enum(['1h', '1d', '1w']).optional(),
          benchmark: z.enum(['BTC', 'ETH', 'NONE']).default('NONE'),
        })
      )
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

        // Calculate date range based on timeframe
        const now = new Date()
        let startDate = new Date()
        
        switch (input.timeframe) {
          case '1D':
            startDate.setDate(now.getDate() - 1)
            break
          case '1W':
            startDate.setDate(now.getDate() - 7)
            break
          case '1M':
            startDate.setMonth(now.getMonth() - 1)
            break
          case '3M':
            startDate.setMonth(now.getMonth() - 3)
            break
          case '1Y':
            startDate.setFullYear(now.getFullYear() - 1)
            break
          case 'ALL':
            startDate = new Date(0) // Beginning of time
            break
        }

        // Get all transactions in the timeframe
        const { data: transactions } = await ctx.supabase
          .from('transactions')
          .select('*, assets(current_price, symbol)')
          .in('portfolio_id', portfolioIds)
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: true })

        // If no transactions in timeframe, return current state as single point
        if (!transactions || transactions.length === 0) {
          // Get current portfolio value
          const { data: allTxs } = await ctx.supabase
            .from('transactions')
            .select('*, assets(current_price)')
            .in('portfolio_id', portfolioIds)
            .order('timestamp', { ascending: true })

          if (!allTxs || allTxs.length === 0) {
            return {
              data: [],
              granularity: input.granularity || '1d',
              benchmark: input.benchmark,
            }
          }

          // Calculate current position
          const currentPositions = new Map<number, { quantity: number, totalCost: number, currentPrice: number }>()
          allTxs.forEach((tx: any) => {
            const existing = currentPositions.get(tx.asset_id) || { 
              quantity: 0, 
              totalCost: 0,
              currentPrice: tx.assets?.current_price || 0 
            }

            if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop') {
              existing.quantity += tx.quantity
              existing.totalCost += tx.quantity * tx.price + (tx.fee || 0)
            } else if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
              const avgPrice = existing.quantity > 0 ? existing.totalCost / existing.quantity : 0
              existing.quantity -= tx.quantity
              existing.totalCost -= tx.quantity * avgPrice
            }

            existing.currentPrice = tx.assets?.current_price || existing.currentPrice
            currentPositions.set(tx.asset_id, existing)
          })

          let totalValue = 0
          let totalCost = 0
          currentPositions.forEach(pos => {
            if (pos.quantity > 0) {
              totalValue += pos.quantity * pos.currentPrice
              totalCost += pos.totalCost
            }
          })

          const unrealizedPnL = totalValue - totalCost
          const todayKey = format(now, 'yyyy-MM-dd')

          return {
            data: [{
              t: now.getTime(),
              date: todayKey,
              value: totalValue,
              invested: totalCost,
              pnl: unrealizedPnL,
              realized: 0,
              unrealized: unrealizedPnL,
              pnlPercent: totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0,
            }],
            granularity: input.granularity || '1d',
            benchmark: input.benchmark,
          }
        }

        // Group transactions by day and calculate portfolio value
        const dailyValues = new Map<string, { date: string, value: number, cost: number }>()
        const positionsMap = new Map<number, { quantity: number, totalCost: number, currentPrice: number }>()

        // Get all transactions before the timeframe to calculate initial positions
        const { data: historicalTxs } = await ctx.supabase
          .from('transactions')
          .select('*, assets(current_price)')
          .in('portfolio_id', portfolioIds)
          .lt('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: true })

        // Calculate initial positions
        historicalTxs?.forEach((tx: any) => {
          const existing = positionsMap.get(tx.asset_id) || { 
            quantity: 0, 
            totalCost: 0,
            currentPrice: tx.assets?.current_price || 0 
          }

          if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop') {
            existing.quantity += tx.quantity
            existing.totalCost += tx.quantity * tx.price + (tx.fee || 0)
          } else if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
            const avgPrice = existing.quantity > 0 ? existing.totalCost / existing.quantity : 0
            existing.quantity -= tx.quantity
            existing.totalCost -= tx.quantity * avgPrice
          }

          positionsMap.set(tx.asset_id, existing)
        })

        // Process transactions in timeframe
        transactions.forEach((tx: any) => {
          const dateKey = format(new Date(tx.timestamp), 'yyyy-MM-dd')
          
          const existing = positionsMap.get(tx.asset_id) || { 
            quantity: 0, 
            totalCost: 0,
            currentPrice: tx.assets?.current_price || 0 
          }

          if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop') {
            existing.quantity += tx.quantity
            existing.totalCost += tx.quantity * tx.price + (tx.fee || 0)
          } else if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
            const avgPrice = existing.quantity > 0 ? existing.totalCost / existing.quantity : 0
            existing.quantity -= tx.quantity
            existing.totalCost -= tx.quantity * avgPrice
          }

          existing.currentPrice = tx.assets?.current_price || existing.currentPrice
          positionsMap.set(tx.asset_id, existing)

          // Calculate total portfolio value at this point
          let totalValue = 0
          let totalCost = 0
          positionsMap.forEach(pos => {
            if (pos.quantity > 0) {
              totalValue += pos.quantity * pos.currentPrice
              totalCost += pos.totalCost
            }
          })

          dailyValues.set(dateKey, { date: dateKey, value: totalValue, cost: totalCost })
        })

        // Convert to array and add current value
        const historyArray = Array.from(dailyValues.values()).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        // Add today's value if not already present
        const todayKey = format(now, 'yyyy-MM-dd')
        if (!dailyValues.has(todayKey)) {
          let totalValue = 0
          let totalCost = 0
          positionsMap.forEach(pos => {
            if (pos.quantity > 0) {
              totalValue += pos.quantity * pos.currentPrice
              totalCost += pos.totalCost
            }
          })
          historyArray.push({ date: todayKey, value: totalValue, cost: totalCost })
        }

        // Calculate realized/unrealized PnL for each point
        const enrichedHistory = historyArray.map(item => {
          const unrealizedPnL = item.value - item.cost
          const realizedPnL = 0 // TODO: track from sell transactions
          
          return {
            t: new Date(item.date).getTime(),
            date: item.date,
            value: item.value,
            invested: item.cost,
            pnl: unrealizedPnL + realizedPnL,
            realized: realizedPnL,
            unrealized: unrealizedPnL,
            pnlPercent: item.cost > 0 ? ((unrealizedPnL + realizedPnL) / item.cost) * 100 : 0,
          }
        })

        return {
          data: enrichedHistory,
          granularity: input.granularity || (input.timeframe === '1D' ? '1h' : '1d'),
          benchmark: input.benchmark,
        }
      }),

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
        const performersMap = new Map<string, { asset: any, value: number, pnl: number, pnlPercent: number, quantity: number, avgBuyPrice: number }>()

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
            existing.quantity += pos.quantity
            existing.value += value
            existing.pnl += pnl
            const totalCost = existing.value - existing.pnl
            existing.avgBuyPrice = existing.quantity > 0 ? totalCost / existing.quantity : 0
            existing.pnlPercent = existing.value > 0 ? (existing.pnl / (existing.value - existing.pnl)) * 100 : 0
          } else {
            performersMap.set(assetKey, {
              asset: pos.assets,
              value,
              pnl,
              pnlPercent,
              quantity: pos.quantity,
              avgBuyPrice: avgPrice,
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
            quantity: p.quantity,
            avgBuyPrice: p.avgBuyPrice,
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

  // Export all user transactions
  export: t.router({
    allTransactions: protectedProcedure
      .query(async ({ ctx }) => {
        // Get all user's portfolios
        const { data: portfolios } = await ctx.supabase
          .from('portfolios')
          .select('id, name')
          .eq('user_id', ctx.user.id)

        if (!portfolios || portfolios.length === 0) {
          return []
        }

        const portfolioIds = portfolios.map(p => p.id)

        // Get all transactions with asset and portfolio info
        const { data: transactions, error } = await ctx.supabase
          .from('transactions')
          .select(`
            *,
            assets (
              symbol,
              name
            ),
            portfolios (
              name
            )
          `)
          .in('portfolio_id', portfolioIds)
          .order('timestamp', { ascending: false })

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        return transactions || []
      }),
  }),

  // Markets
  markets: marketsRouter,
})

export type AppRouter = typeof appRouter
