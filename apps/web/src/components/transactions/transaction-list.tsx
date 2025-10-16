'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare, X, Trash2 } from 'lucide-react'
import { TransactionRow } from './transaction-row'

interface TransactionListProps {
  transactions: any[]
  title?: string
  currentPrice?: number
  isLoading?: boolean
  showAsset?: boolean
  showPortfolio?: boolean
  showROI?: boolean
  onEdit?: (transaction: any) => void
  onBulkDelete?: (transactionIds: number[]) => void
  emptyMessage?: string
}

export function TransactionList({
  transactions,
  title = 'Transaction History',
  currentPrice,
  isLoading = false,
  showAsset = false,
  showPortfolio = false,
  showROI = true,
  onEdit,
  onBulkDelete,
  emptyMessage = 'No transactions yet',
}: TransactionListProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([])

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedTransactions.length > 0) {
      if (confirm(`Delete ${selectedTransactions.length} transaction(s)?`)) {
        onBulkDelete(selectedTransactions)
        setSelectedTransactions([])
        setIsSelectionMode(false)
      }
    }
  }

  return (
    <Card className="glass-strong border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {onBulkDelete && transactions.length > 0 && (
          <div className="flex gap-2">
            {!isSelectionMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSelectionMode(true)}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Select
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSelectionMode(false)
                    setSelectedTransactions([])
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                {selectedTransactions.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedTransactions.length})
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                currentPrice={currentPrice}
                isSelectionMode={isSelectionMode}
                isSelected={selectedTransactions.includes(tx.id)}
                onSelectionChange={(checked) => {
                  if (checked) {
                    setSelectedTransactions([...selectedTransactions, tx.id])
                  } else {
                    setSelectedTransactions(selectedTransactions.filter(id => id !== tx.id))
                  }
                }}
                onEdit={onEdit ? () => onEdit(tx) : undefined}
                showAsset={showAsset}
                showPortfolio={showPortfolio}
                showROI={showROI}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
