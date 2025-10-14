'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Edit, Trash2, Loader2 } from 'lucide-react'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog'

export default function PortfolioDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPnlMethod, setEditPnlMethod] = useState<'fifo' | 'lifo' | 'avg'>('fifo')
  const [editIncludeFees, setEditIncludeFees] = useState(true)
  
  const { data: portfolio, isLoading: portfolioLoading } = trpc.portfolios.getById.useQuery({ id })
  const { data: positions, isLoading: positionsLoading } = trpc.positions.list.useQuery(
    { portfolio_id: id },
    { enabled: !!id }
  )
  const { data: transactions, isLoading: transactionsLoading } = trpc.transactions.list.useQuery(
    { portfolio_id: id },
    { enabled: !!id }
  )

  const utils = trpc.useUtils()
  
  const updatePortfolio = trpc.portfolios.update.useMutation({
    onSuccess: () => {
      utils.portfolios.getById.invalidate({ id })
      utils.portfolios.list.invalidate()
      setIsEditDialogOpen(false)
    },
  })

  const deletePortfolio = trpc.portfolios.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/portfolios')
    },
  })

  const handleEdit = () => {
    if (!portfolio) return
    setEditName(portfolio.name)
    setEditPnlMethod(portfolio.pnl_method as 'fifo' | 'lifo' | 'avg')
    setEditIncludeFees(portfolio.include_fees)
    setIsEditDialogOpen(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    updatePortfolio.mutate({
      id,
      name: editName,
      pnl_method: editPnlMethod,
      include_fees: editIncludeFees,
    })
  }

  const handleDelete = () => {
    deletePortfolio.mutate({ id })
  }

  if (portfolioLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 glass rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Portfolio not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/portfolios">Back to Portfolios</Link>
        </Button>
      </div>
    )
  }

  // Calculate totals
  const totalValue = positions?.reduce((sum, pos) => sum + (pos.quantity * (pos.assets?.current_price || 0)), 0) || 0
  const totalCost = positions?.reduce((sum, pos) => sum + (pos.avg_price * pos.quantity), 0) || 0
  const totalPnL = totalValue - totalCost
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/portfolios">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gradient">{portfolio.name}</h1>
            <p className="text-muted-foreground mt-2">
              {portfolio.pnl_method.toUpperCase()} • {portfolio.base_currency}
              {portfolio.include_fees && ' • Fees included'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <AddTransactionDialog portfolioId={id} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cost: {formatCurrency(totalCost)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-profit" />
            ) : (
              <TrendingDown className="h-4 w-4 text-loss" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold tabular-nums', totalPnL >= 0 ? 'text-profit' : 'text-loss')}>
              {formatCurrency(totalPnL)}
            </div>
            <p className={cn('text-xs mt-1', totalPnL >= 0 ? 'text-profit' : 'text-loss')}>
              {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{positions?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions?.length || 0} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Positions */}
      <Card className="glass-strong border-white/10">
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : positions && positions.length > 0 ? (
            <div className="space-y-2">
              {positions.map((position) => {
                const currentPrice = position.assets?.current_price || 0
                const currentValue = position.quantity * currentPrice
                const cost = position.avg_price * position.quantity
                const pnl = currentValue - cost
                const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0

                return (
                  <Link
                    key={position.id}
                    href={`/dashboard/assets/${position.asset_id}`}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {position.assets?.icon_url ? (
                        <img 
                          src={position.assets.icon_url} 
                          alt={position.assets.symbol} 
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                          <span className="text-sm font-bold">{position.assets?.symbol.slice(0, 2)}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium group-hover:text-primary transition-colors">{position.assets?.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(position.quantity)} @ {formatCurrency(position.avg_price)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold tabular-nums">{formatCurrency(currentValue)}</div>
                      <div className={cn('text-sm tabular-nums', pnl >= 0 ? 'text-profit' : 'text-loss')}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No positions yet</p>
              <AddTransactionDialog portfolioId={id} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="glass-strong border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {tx.assets.icon_url ? (
                      <img 
                        src={tx.assets.icon_url} 
                        alt={tx.assets.symbol} 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <span className="text-xs font-bold">{tx.assets.symbol.slice(0, 2)}</span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        <span>{tx.assets.symbol}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className={cn(
                          'text-xs',
                          tx.type === 'buy' || tx.type === 'transfer_in' ? 'text-profit' : 'text-loss'
                        )}>
                          {tx.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(tx.timestamp), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium tabular-nums">
                      {formatNumber(tx.quantity)} @ {formatCurrency(tx.price)}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(tx.quantity * tx.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Portfolio</DialogTitle>
              <DialogDescription>
                Update your portfolio settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Portfolio Name</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pnl_method">P&L Method</Label>
                <Select value={editPnlMethod} onValueChange={(v: any) => setEditPnlMethod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                    <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                    <SelectItem value="avg">Average Cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include_fees"
                  checked={editIncludeFees}
                  onChange={(e) => setEditIncludeFees(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="include_fees">Include fees in calculations</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePortfolio.isPending}>
                {updatePortfolio.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Portfolio</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{portfolio?.name}"? This action cannot be undone and will delete all associated transactions.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePortfolio.isPending}>
              {deletePortfolio.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Portfolio'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
