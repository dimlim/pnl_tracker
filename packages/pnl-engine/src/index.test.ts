import { describe, it, expect } from 'vitest'
import { computePnL, calculateUnrealizedPnL, calculatePnLPercentage } from './index'
import type { Transaction } from '@crypto-pnl/types'

describe('PnL Engine', () => {
  describe('computePnL', () => {
    it('should calculate FIFO with fees correctly', () => {
      const txs: Transaction[] = [
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'buy',
          quantity: 1,
          price: 100,
          fee: 1,
          timestamp: new Date('2024-01-01'),
        },
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'sell',
          quantity: 1,
          price: 120,
          fee: 1,
          timestamp: new Date('2024-01-02'),
        },
      ]

      const result = computePnL(txs, 'fifo', true)
      
      // Buy: cost basis = (100 * 1 + 1) / 1 = 101
      // Sell: proceeds = 120 * 1 = 120, fee = 1
      // PnL = 120 - 101 - 1 = 18
      expect(result.realized).toBeCloseTo(18, 2)
      expect(result.quantity).toBe(0)
    })

    it('should calculate LIFO correctly', () => {
      const txs: Transaction[] = [
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'buy',
          quantity: 1,
          price: 100,
          fee: 0,
          timestamp: new Date('2024-01-01'),
        },
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'buy',
          quantity: 1,
          price: 110,
          fee: 0,
          timestamp: new Date('2024-01-02'),
        },
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'sell',
          quantity: 1,
          price: 120,
          fee: 0,
          timestamp: new Date('2024-01-03'),
        },
      ]

      const result = computePnL(txs, 'lifo', false)
      
      // LIFO: sells the 110 lot first
      // PnL = 120 - 110 = 10
      expect(result.realized).toBeCloseTo(10, 2)
      expect(result.quantity).toBe(1)
      expect(result.avgPrice).toBeCloseTo(100, 2)
    })

    it('should calculate average cost method correctly', () => {
      const txs: Transaction[] = [
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'buy',
          quantity: 1,
          price: 100,
          fee: 0,
          timestamp: new Date('2024-01-01'),
        },
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'buy',
          quantity: 1,
          price: 120,
          fee: 0,
          timestamp: new Date('2024-01-02'),
        },
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'sell',
          quantity: 1,
          price: 130,
          fee: 0,
          timestamp: new Date('2024-01-03'),
        },
      ]

      const result = computePnL(txs, 'avg', false)
      
      // Average cost = (100 + 120) / 2 = 110
      // PnL = 130 - 110 = 20
      expect(result.realized).toBeCloseTo(20, 2)
      expect(result.quantity).toBe(1)
    })

    it('should handle partial sells correctly', () => {
      const txs: Transaction[] = [
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'buy',
          quantity: 2,
          price: 100,
          fee: 0,
          timestamp: new Date('2024-01-01'),
        },
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'sell',
          quantity: 0.5,
          price: 120,
          fee: 0,
          timestamp: new Date('2024-01-02'),
        },
      ]

      const result = computePnL(txs, 'fifo', false)
      
      // PnL = (120 - 100) * 0.5 = 10
      expect(result.realized).toBeCloseTo(10, 2)
      expect(result.quantity).toBeCloseTo(1.5, 2)
      expect(result.avgPrice).toBeCloseTo(100, 2)
    })

    it('should handle airdrops (zero cost basis)', () => {
      const txs: Transaction[] = [
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'airdrop',
          quantity: 100,
          price: 0,
          fee: 0,
          timestamp: new Date('2024-01-01'),
        },
        {
          portfolio_id: 'test',
          asset_id: 1,
          type: 'sell',
          quantity: 50,
          price: 10,
          fee: 0,
          timestamp: new Date('2024-01-02'),
        },
      ]

      const result = computePnL(txs, 'fifo', false)
      
      // PnL = (10 - 0) * 50 = 500
      expect(result.realized).toBeCloseTo(500, 2)
      expect(result.quantity).toBe(50)
    })
  })

  describe('calculateUnrealizedPnL', () => {
    it('should calculate unrealized gains correctly', () => {
      const unrealized = calculateUnrealizedPnL(100, 150, 2)
      expect(unrealized).toBe(100) // (150 - 100) * 2
    })

    it('should calculate unrealized losses correctly', () => {
      const unrealized = calculateUnrealizedPnL(100, 80, 2)
      expect(unrealized).toBe(-40) // (80 - 100) * 2
    })
  })

  describe('calculatePnLPercentage', () => {
    it('should calculate percentage correctly', () => {
      const percentage = calculatePnLPercentage(50, 200)
      expect(percentage).toBe(25) // (50 / 200) * 100
    })

    it('should handle zero cost basis', () => {
      const percentage = calculatePnLPercentage(50, 0)
      expect(percentage).toBe(0)
    })
  })
})
