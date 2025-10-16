import { describe, it, expect, vi } from 'vitest'
import { calculatePortfolioHistory } from './history'
import type { Transaction, AssetPrice } from './history'

describe('Portfolio History Calculation', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 1,
      asset_id: 1,
      type: 'buy',
      quantity: 1,
      price: 100,
      fee: 1,
      timestamp: new Date('2025-10-10T00:00:00Z'),
    },
    {
      id: 2,
      asset_id: 1,
      type: 'buy',
      quantity: 1,
      price: 110,
      fee: 1,
      timestamp: new Date('2025-10-12T00:00:00Z'),
    },
  ]

  const mockPriceFetcher = async (date: Date, assetIds: number[]): Promise<AssetPrice[]> => {
    // Mock prices: gradually increasing
    const daysSinceStart = Math.floor(
      (date.getTime() - new Date('2025-10-10').getTime()) / (1000 * 60 * 60 * 24)
    )
    const price = 100 + daysSinceStart * 5

    return assetIds.map((id) => ({
      asset_id: id,
      symbol: 'BTC',
      price,
    }))
  }

  it('should calculate 7-day history correctly', async () => {
    const history = await calculatePortfolioHistory(
      mockTransactions,
      7,
      'avg',
      mockPriceFetcher
    )

    expect(history).toHaveLength(7)
    expect(history[0].timestamp).toBeDefined()
    expect(history[0].totalValue).toBeGreaterThanOrEqual(0)
    expect(history[0].totalCost).toBeGreaterThanOrEqual(0)
  })

  it('should show increasing value with price appreciation', async () => {
    const history = await calculatePortfolioHistory(
      mockTransactions,
      7,
      'avg',
      mockPriceFetcher
    )

    // Value should increase as price increases
    const firstValue = history[0].totalValue
    const lastValue = history[history.length - 1].totalValue

    expect(lastValue).toBeGreaterThan(firstValue)
  })

  it('should calculate P&L correctly', async () => {
    const history = await calculatePortfolioHistory(
      mockTransactions,
      7,
      'avg',
      mockPriceFetcher
    )

    history.forEach((point) => {
      expect(point.totalPnl).toBe(point.totalValue - point.totalCost)
      if (point.totalCost > 0) {
        expect(point.roi).toBe((point.totalPnl / point.totalCost) * 100)
      }
    })
  })

  it('should handle empty transactions', async () => {
    const history = await calculatePortfolioHistory(
      [],
      7,
      'avg',
      mockPriceFetcher
    )

    expect(history).toHaveLength(7)
    history.forEach((point) => {
      expect(point.totalValue).toBe(0)
      expect(point.totalCost).toBe(0)
      expect(point.totalPnl).toBe(0)
      expect(point.roi).toBe(0)
    })
  })

  it('should only include transactions up to each day', async () => {
    const history = await calculatePortfolioHistory(
      mockTransactions,
      7,
      'avg',
      mockPriceFetcher
    )

    // First day (Oct 10) should have 1 BTC
    // Days after Oct 12 should have 2 BTC
    const oct10Index = history.findIndex(
      (h) => h.timestamp.toISOString().startsWith('2025-10-10')
    )
    const oct13Index = history.findIndex(
      (h) => h.timestamp.toISOString().startsWith('2025-10-13')
    )

    if (oct10Index >= 0) {
      // Should have 1 BTC worth ~100
      expect(history[oct10Index].totalCost).toBeCloseTo(101, 0) // 100 + 1 fee
    }

    if (oct13Index >= 0) {
      // Should have 2 BTC worth more
      expect(history[oct13Index].totalCost).toBeCloseTo(212, 0) // (100+1) + (110+1)
    }
  })

  it('should handle sell transactions', async () => {
    const txWithSell: Transaction[] = [
      ...mockTransactions,
      {
        id: 3,
        asset_id: 1,
        type: 'sell',
        quantity: 0.5,
        price: 120,
        fee: 1,
        timestamp: new Date('2025-10-14T00:00:00Z'),
      },
    ]

    const history = await calculatePortfolioHistory(
      txWithSell,
      7,
      'avg',
      mockPriceFetcher
    )

    const oct14Index = history.findIndex(
      (h) => h.timestamp.toISOString().startsWith('2025-10-14')
    )

    if (oct14Index >= 0) {
      // Should have 1.5 BTC remaining (2 - 0.5)
      // Cost should be reduced proportionally
      expect(history[oct14Index].totalCost).toBeLessThan(212)
    }
  })

  it('should respect different PnL methods', async () => {
    const fifoHistory = await calculatePortfolioHistory(
      mockTransactions,
      7,
      'fifo',
      mockPriceFetcher
    )

    const lifoHistory = await calculatePortfolioHistory(
      mockTransactions,
      7,
      'lifo',
      mockPriceFetcher
    )

    const avgHistory = await calculatePortfolioHistory(
      mockTransactions,
      7,
      'avg',
      mockPriceFetcher
    )

    // All should have same length
    expect(fifoHistory).toHaveLength(7)
    expect(lifoHistory).toHaveLength(7)
    expect(avgHistory).toHaveLength(7)

    // For buy-only transactions, all methods should give same result
    expect(fifoHistory[fifoHistory.length - 1].totalCost).toBeCloseTo(
      avgHistory[avgHistory.length - 1].totalCost,
      2
    )
  })
})

describe('Price Fetcher Integration', () => {
  it('should handle missing prices gracefully', async () => {
    const mockPriceFetcherWithMissing = async (
      date: Date,
      assetIds: number[]
    ): Promise<AssetPrice[]> => {
      // Only return price for asset 1, not asset 2
      return [
        {
          asset_id: 1,
          symbol: 'BTC',
          price: 100,
        },
      ]
    }

    const txMultiAsset: Transaction[] = [
      {
        id: 1,
        asset_id: 1,
        type: 'buy',
        quantity: 1,
        price: 100,
        fee: 0,
        timestamp: new Date('2025-10-10T00:00:00Z'),
      },
      {
        id: 2,
        asset_id: 2,
        type: 'buy',
        quantity: 10,
        price: 10,
        fee: 0,
        timestamp: new Date('2025-10-10T00:00:00Z'),
      },
    ]

    const history = await calculatePortfolioHistory(
      txMultiAsset,
      7,
      'avg',
      mockPriceFetcherWithMissing
    )

    // Should still calculate, but asset 2 will have 0 value
    expect(history).toHaveLength(7)
    expect(history[0].totalValue).toBeGreaterThan(0)
  })
})
