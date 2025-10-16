'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wallet, TrendingUp, TrendingDown, Search, X, Loader2, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog'
import { ExportTransactions } from '@/components/transactions/export-transactions'
import { ImportTransactions } from '@/components/transactions/import-transactions'
import { TransactionList } from '@/components/transactions/transaction-list'
import { Number } from '@/components/ui/number'
import { BulkActionsBar } from '@/components/transactions/bulk-actions-bar'
import { BulkMoveDialog } from '@/components/transactions/bulk-move-dialog'
import { useBulkSelection } from '@/hooks/use-bulk-selection'
import { toast } from 'sonner'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type SortField = 'date' | 'asset' | 'type' | 'quantity' | 'price' | 'value' | 'roi'
type SortDirection = 'asc' | 'desc' | null

// Sort Icon Component
const SortIcon = ({ field, currentField, direction }: { field: SortField, currentField: SortField, direction: SortDirection }) => {
  if (currentField !== field) {
    return <ArrowUpDown className="w-3 h-3 opacity-30" />
  }
  if (direction === 'asc') {
    return <ArrowUp className="w-3 h-3" />
  }
  if (direction === 'desc') {
    return <ArrowDown className="w-3 h-3" />
  }
  return <ArrowUpDown className="w-3 h-3 opacity-30" />
}

export default function TransactionsPage() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterType, setFilterType] = useState<string>('all')
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null)

  const utils = trpc.useUtils()
  const { data: portfolios } = trpc.portfolios.list.useQuery()
  const { data: allTransactions, isLoading } = trpc.transactions.listAll.useQuery()

  const deleteTransaction = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.listAll.invalidate()
      utils.positions.list.invalidate()
      setDeletingTransactionId(null)
    },
  })

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction: desc -> asc -> null -> desc
      if (sortDirection === 'desc') setSortDirection('asc')
      else if (sortDirection === 'asc') setSortDirection(null)
      else setSortDirection('desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    if (!allTransactions) return []

    let filtered = allTransactions

    // Filter by portfolio
    if (selectedPortfolioId) {
      filtered = filtered.filter(tx => tx.portfolio_id === selectedPortfolioId)
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.assets?.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.assets?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    if (sortDirection) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any

        switch (sortField) {
          case 'date':
            aVal = new Date(a.timestamp).getTime()
            bVal = new Date(b.timestamp).getTime()
            break
          case 'asset':
            aVal = a.assets?.symbol || ''
            bVal = b.assets?.symbol || ''
            break
          case 'type':
            aVal = a.type
            bVal = b.type
            break
          case 'quantity':
            aVal = a.quantity
            bVal = b.quantity
            break
          case 'price':
            aVal = a.price
            bVal = b.price
            break
          case 'value':
            aVal = a.quantity * a.price
            bVal = b.quantity * b.price
            break
          case 'roi':
            const aCurrentPrice = a.assets?.current_price || a.price
            const bCurrentPrice = b.assets?.current_price || b.price
            aVal = ((aCurrentPrice - a.price) / a.price) * 100
            bVal = ((bCurrentPrice - b.price) / b.price) * 100
            break
        }

        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }

    return filtered
  }, [allTransactions, selectedPortfolioId, filterType, searchQuery, sortField, sortDirection])

  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    if (!portfolios || !allTransactions) return []

    return portfolios.map(portfolio => {
      const txs = allTransactions.filter(tx => tx.portfolio_id === portfolio.id)
      const totalValue = txs.reduce((sum, tx) => {
        if (tx.type === 'buy' || tx.type === 'transfer_in') {
          return sum + (tx.quantity * tx.price)
        }
        return sum
      }, 0)

      return {
        ...portfolio,
        transactionCount: txs.length,
        totalValue,
      }
    })
  }, [portfolios, allTransactions])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Transactions</h1>
          <p className="text-muted-foreground mt-2">Track all your crypto transactions</p>
        </div>

        <div className="flex gap-2">
          <ImportTransactions />
          <ExportTransactions portfolioId={selectedPortfolioId || undefined} />
          <AddTransactionDialog 
            open={isTransactionDialogOpen}
            onOpenChange={setIsTransactionDialogOpen}
            trigger={
              <Button>
                Add Transaction
              </Button>
            }
          />
        </div>
      </div>

      {/* Portfolio Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolioStats.map((portfolio) => (
          <Card
            key={portfolio.id}
            className={cn(
              "glass-strong border-white/10 cursor-pointer transition-all hover:scale-105",
              selectedPortfolioId === portfolio.id && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedPortfolioId(
              selectedPortfolioId === portfolio.id ? null : portfolio.id
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{portfolio.name}</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                <Number>{formatCurrency(portfolio.totalValue)}</Number>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {portfolio.transactionCount} transaction{portfolio.transactionCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="glass-strong border-white/10">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="transfer_in">Transfer In</SelectItem>
                <SelectItem value="transfer_out">Transfer Out</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPortfolioId(null)
                setSearchQuery('')
                setFilterType('all')
                setSortField('date')
                setSortDirection('desc')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <TransactionList
        transactions={filteredTransactions}
        title={selectedPortfolioId 
          ? `${portfolios?.find(p => p.id === selectedPortfolioId)?.name} Transactions (${filteredTransactions.length})`
          : `All Transactions (${filteredTransactions.length})`
        }
        isLoading={isLoading}
        showAsset={true}
        showPortfolio={true}
        showROI={true}
        emptyMessage="No transactions found. Try adjusting your filters."
      />

      {/* Old Card - keeping for reference, will remove after testing */}
      <Card className="hidden glass-strong border-white/10">
        <CardHeader>
          <CardTitle>
            {selectedPortfolioId 
              ? `${portfolios?.find(p => p.id === selectedPortfolioId)?.name} Transactions`
              : 'All Transactions'
            } ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-2">
              {/* Column Headers */}
              <div className="grid grid-cols-[60px_120px_1fr_100px] gap-3 px-3 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-white/10">
                <button 
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Type
                  <SortIcon field="type" currentField={sortField} direction={sortDirection} />
                </button>
                <button 
                  onClick={() => handleSort('asset')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Asset
                  <SortIcon field="asset" currentField={sortField} direction={sortDirection} />
                </button>
                <div className="grid grid-cols-6 gap-4">
                  <div>Portfolio</div>
                  <button 
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Date
                    <SortIcon field="date" currentField={sortField} direction={sortDirection} />
                  </button>
                  <button 
                    onClick={() => handleSort('quantity')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Quantity
                    <SortIcon field="quantity" currentField={sortField} direction={sortDirection} />
                  </button>
                  <button 
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Buy Price
                    <SortIcon field="price" currentField={sortField} direction={sortDirection} />
                  </button>
                  <button 
                    onClick={() => handleSort('value')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Current Value
                    <SortIcon field="value" currentField={sortField} direction={sortDirection} />
                  </button>
                  <button 
                    onClick={() => handleSort('roi')}
                    className="flex items-center gap-1 justify-end hover:text-foreground transition-colors"
                  >
                    ROI
                    <SortIcon field="roi" currentField={sortField} direction={sortDirection} />
                  </button>
                </div>
                <div className="text-right">Actions</div>
              </div>

              {/* Transaction Rows */}
              {filteredTransactions.map((tx) => {
                const isProfit = tx.type === 'buy' || tx.type === 'transfer_in'
                const currentPrice = tx.assets?.current_price || 0
                const currentValue = tx.quantity * currentPrice
                const buyValue = tx.quantity * tx.price
                const roi = buyValue > 0 ? ((currentValue - buyValue) / buyValue) * 100 : 0
                const roiAmount = currentValue - buyValue
                
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-white/5 group relative"
                  >
                    <div className={cn(
                      "px-2 py-1 rounded text-xs font-semibold uppercase w-[60px] text-center",
                      isProfit ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                    )}>
                      {tx.type.replace('_', ' ')}
                    </div>
                    
                    <div className="flex items-center gap-2 min-w-[120px]">
                      {tx.assets?.icon_url ? (
                        <img 
                          src={tx.assets.icon_url} 
                          alt={tx.assets.symbol} 
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                          {tx.assets?.symbol[0]}
                        </div>
                      )}
                      <span className="font-medium text-sm">{tx.assets?.symbol}</span>
                    </div>

                    <div className="flex-1 grid grid-cols-6 gap-4 text-sm items-center">
                      <div className="text-muted-foreground truncate">
                        {tx.portfolios?.name || 'Unknown'}
                      </div>
                      <div className="text-muted-foreground">
                        {format(new Date(tx.timestamp), 'MMM dd, HH:mm')}
                      </div>
                      <Number className="font-medium">{formatNumber(tx.quantity)}</Number>
                      <Number className="font-medium">{formatCurrency(tx.price)}</Number>
                      <Number className="font-medium">{formatCurrency(currentValue)}</Number>
                      <div className={cn(
                        "text-right font-semibold",
                        roi > 0 ? "text-profit" : roi < 0 ? "text-loss" : "text-muted-foreground"
                      )}>
                        <div>{roi > 0 ? '+' : ''}{roi.toFixed(2)}%</div>
                        <div className="text-xs">
                          {roiAmount > 0 ? '+' : ''}{formatCurrency(roiAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Edit/Delete buttons - show on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingTransaction(tx)
                        }}
                        title="Edit transaction"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (tx.id) setDeletingTransactionId(tx.id)
                        }}
                        disabled={deleteTransaction.isPending}
                        title="Delete transaction"
                      >
                        {deleteTransaction.isPending && deletingTransactionId === tx.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-loss" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterType !== 'all' || selectedPortfolioId
                  ? 'No transactions match your filters'
                  : 'No transactions yet'
                }
              </p>
              <Button onClick={() => setIsTransactionDialogOpen(true)}>
                Add Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <AddTransactionDialog
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          portfolioId={editingTransaction.portfolio_id}
          transaction={editingTransaction}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTransactionId} onOpenChange={(open) => !open && setDeletingTransactionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transaction from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTransactionId) {
                  deleteTransaction.mutate({ id: deletingTransactionId })
                }
              }}
              className="bg-loss hover:bg-loss/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
