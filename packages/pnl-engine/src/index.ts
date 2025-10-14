import type { Transaction, Lot, PnLMethod, PnLResult } from '@crypto-pnl/types'

/**
 * Compute PnL (Profit and Loss) for a series of transactions
 * Supports FIFO, LIFO, and Average Cost methods
 */
export function computePnL(
  transactions: Transaction[],
  method: PnLMethod,
  includeFees = true
): PnLResult {
  const lots: Lot[] = []
  let realized = 0

  // Sort transactions by timestamp
  const sortedTxs = [...transactions].sort((a, b) => {
    const tsA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp.getTime()
    const tsB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp.getTime()
    return tsA - tsB
  })

  for (const tx of sortedTxs) {
    const fee = includeFees ? (tx.fee || 0) : 0

    // Buy/Acquire transactions: add to lots
    if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'airdrop' || tx.type === 'deposit') {
      const totalCost = tx.price * tx.quantity + fee
      const avgPrice = tx.quantity > 0 ? totalCost / tx.quantity : 0
      lots.push({ qty: tx.quantity, price: avgPrice })
    }

    // Sell/Dispose transactions: remove from lots and calculate realized PnL
    if (tx.type === 'sell' || tx.type === 'transfer_out' || tx.type === 'withdraw') {
      let remainingQty = tx.quantity
      const feePerUnit = tx.quantity > 0 ? fee / tx.quantity : 0

      while (remainingQty > 0 && lots.length > 0) {
        let lot: Lot

        if (method === 'avg') {
          // Average method: collapse all lots into one
          lot = avgCollapse(lots)
        } else if (method === 'lifo') {
          // LIFO: take from end
          lot = lots.pop()!
        } else {
          // FIFO: take from beginning
          lot = lots.shift()!
        }

        const takeQty = Math.min(remainingQty, lot.qty)
        const saleProceeds = tx.price * takeQty
        const costBasis = lot.price * takeQty
        const feeCost = feePerUnit * takeQty

        realized += saleProceeds - costBasis - feeCost

        // If lot has remaining quantity, put it back
        const leftoverQty = lot.qty - takeQty
        if (leftoverQty > 0 && method !== 'avg') {
          if (method === 'lifo') {
            lots.push({ qty: leftoverQty, price: lot.price })
          } else {
            lots.unshift({ qty: leftoverQty, price: lot.price })
          }
        }

        remainingQty -= takeQty
      }
    }
  }

  // Calculate remaining quantity and average price
  const quantity = lots.reduce((sum, lot) => sum + lot.qty, 0)
  const totalValue = lots.reduce((sum, lot) => sum + lot.qty * lot.price, 0)
  const avgPrice = quantity > 0 ? totalValue / quantity : 0

  return {
    realized,
    quantity,
    avgPrice,
  }
}

/**
 * Collapse all lots into a single lot with average price
 */
function avgCollapse(lots: Lot[]): Lot {
  const totalQty = lots.reduce((sum, lot) => sum + lot.qty, 0)
  const totalValue = lots.reduce((sum, lot) => sum + lot.qty * lot.price, 0)
  const avgPrice = totalQty > 0 ? totalValue / totalQty : 0

  lots.length = 0 // Clear the array
  return { qty: totalQty, price: avgPrice }
}

/**
 * Calculate unrealized PnL for current holdings
 */
export function calculateUnrealizedPnL(
  avgEntryPrice: number,
  currentPrice: number,
  quantity: number
): number {
  return (currentPrice - avgEntryPrice) * quantity
}

/**
 * Calculate total PnL (realized + unrealized)
 */
export function calculateTotalPnL(
  realizedPnL: number,
  avgEntryPrice: number,
  currentPrice: number,
  quantity: number
): number {
  const unrealized = calculateUnrealizedPnL(avgEntryPrice, currentPrice, quantity)
  return realizedPnL + unrealized
}

/**
 * Calculate PnL percentage
 */
export function calculatePnLPercentage(pnl: number, costBasis: number): number {
  if (costBasis === 0) return 0
  return (pnl / costBasis) * 100
}
