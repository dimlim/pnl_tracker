'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Edit } from 'lucide-react'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { CryptoIcon } from '@/components/ui/crypto-icon'

interface TransactionRowProps {
  transaction: any
  currentPrice?: number
  isSelectionMode?: boolean
  isSelected?: boolean
  onSelectionChange?: (checked: boolean) => void
  onEdit?: () => void
  showAsset?: boolean
  showPortfolio?: boolean
  showROI?: boolean
}

export function TransactionRow({
  transaction: tx,
  currentPrice,
  isSelectionMode = false,
  isSelected = false,
  onSelectionChange,
  onEdit,
  showAsset = false,
  showPortfolio = false,
  showROI = true,
}: TransactionRowProps) {
  const txValue = tx.quantity * tx.price
  const actualCurrentPrice = currentPrice || tx.assets?.current_price || tx.price
  const currentValue = tx.quantity * actualCurrentPrice
  const pnl = currentValue - txValue
  const pnlPercent = (pnl / txValue) * 100
  const isProfitable = pnl >= 0
  const isBuy = tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'deposit' || tx.type === 'airdrop'
  
  // Calculate days held
  const txDate = new Date(tx.timestamp)
  const now = new Date()
  const daysHeld = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Calculate ROI
  const roi = isBuy ? pnlPercent : 0

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors border",
        isSelected ? "border-primary bg-primary/5" : "border-white/5"
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        {isSelectionMode && onSelectionChange && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelectionChange}
          />
        )}
        
        {/* Icon */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          isBuy ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'
        )}>
          {isBuy ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )}
        </div>
        
        {/* Asset Info (if showAsset) */}
        {showAsset && tx.assets && (
          <Link 
            href={`/dashboard/assets/${tx.asset_id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <CryptoIcon 
              symbol={tx.assets.symbol} 
              iconUrl={tx.assets.icon_url}
              size={32} 
            />
            <div>
              <div className="font-medium">{tx.assets.symbol}</div>
              <div className="text-xs text-muted-foreground">{tx.assets.name}</div>
            </div>
          </Link>
        )}
        
        {/* Transaction Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium uppercase text-sm">{tx.type}</div>
            {isBuy && showROI && (
              <div className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                isProfitable ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'
              )}>
                {isProfitable ? '🟢' : '🔴'} {isProfitable ? 'Profit' : 'Loss'}
              </div>
            )}
            {showPortfolio && tx.portfolios && (
              <div className="px-2 py-0.5 rounded text-xs bg-white/10">
                {tx.portfolios.name}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(txDate, 'MMM dd, yyyy HH:mm')} · {daysHeld}d held
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1">Quantity</div>
          <div className="font-semibold tabular-nums">
            {formatNumber(tx.quantity)}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1">Buy Price</div>
          <div className="font-semibold tabular-nums">
            {formatCurrency(tx.price)}
          </div>
        </div>
        
        {isBuy && showROI && (
          <>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Current Value</div>
              <div className="font-semibold tabular-nums">
                {formatCurrency(currentValue)}
              </div>
            </div>
            
            <div className="text-right min-w-[100px]">
              <div className="text-xs text-muted-foreground mb-1">ROI</div>
              <div className={cn(
                "font-bold tabular-nums text-lg",
                isProfitable ? "text-profit" : "text-loss"
              )}>
                {isProfitable ? '+' : ''}{roi.toFixed(2)}%
              </div>
              <div className={cn(
                "text-xs tabular-nums",
                isProfitable ? "text-profit" : "text-loss"
              )}>
                {isProfitable ? '+' : ''}{formatCurrency(pnl)}
              </div>
            </div>
          </>
        )}
        
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="flex-shrink-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
