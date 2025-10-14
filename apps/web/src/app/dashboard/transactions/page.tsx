'use client'

import { useState } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function TransactionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('')
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [txType, setTxType] = useState<'buy' | 'sell' | 'transfer_in' | 'transfer_out'>('buy')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fee, setFee] = useState('')
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16))
  const [note, setNote] = useState('')

  const utils = trpc.useUtils()
  const { data: portfolios } = trpc.portfolios.list.useQuery()
  const { data: assets } = trpc.assets.list.useQuery()
  const { data: transactions, isLoading } = trpc.transactions.list.useQuery(
    { portfolio_id: selectedPortfolio },
    { enabled: !!selectedPortfolio }
  )

  const createTransaction = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate()
      setDialogOpen(false)
      resetForm()
    },
  })

  const deleteTransaction = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate()
    },
  })

  const resetForm = () => {
    setSelectedAsset('')
    setTxType('buy')
    setQuantity('')
    setPrice('')
    setFee('')
    setTimestamp(new Date().toISOString().slice(0, 16))
    setNote('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPortfolio || !selectedAsset) return

    createTransaction.mutate({
      portfolio_id: selectedPortfolio,
      asset_id: parseInt(selectedAsset),
      type: txType,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fee: fee ? parseFloat(fee) : 0,
      timestamp: new Date(timestamp).toISOString(),
      note: note || undefined,
    })
  }

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'buy':
      case 'transfer_in':
      case 'deposit':
      case 'airdrop':
        return <TrendingUp className="w-4 h-4 text-profit" />
      case 'sell':
      case 'transfer_out':
      case 'withdraw':
        return <TrendingDown className="w-4 h-4 text-loss" />
      default:
        return <ArrowRight className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getTxColor = (type: string) => {
    switch (type) {
      case 'buy':
      case 'transfer_in':
      case 'deposit':
      case 'airdrop':
        return 'text-profit'
      case 'sell':
      case 'transfer_out':
      case 'withdraw':
        return 'text-loss'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Transactions</h1>
          <p className="text-muted-foreground mt-2">Track all your crypto transactions</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!portfolios || portfolios.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>Record a new crypto transaction</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio</Label>
                    <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select portfolio" />
                      </SelectTrigger>
                      <SelectContent>
                        {portfolios?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asset">Asset</Label>
                    <Select value={selectedAsset} onValueChange={setSelectedAsset} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets?.map((a) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.symbol} - {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={txType} onValueChange={(v: any) => setTxType(v)} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="transfer_in">Transfer In</SelectItem>
                        <SelectItem value="transfer_out">Transfer Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timestamp">Date & Time</Label>
                    <Input
                      id="timestamp"
                      type="datetime-local"
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fee">Fee (optional)</Label>
                    <Input
                      id="fee"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input
                    id="note"
                    placeholder="Add a note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createTransaction.isPending}>
                  {createTransaction.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Transaction'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio Filter */}
      <Card className="glass-strong border-white/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Portfolio:</Label>
            <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {selectedPortfolio ? (
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        {getTxIcon(tx.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tx.assets.symbol}</span>
                          <span className={cn('text-sm uppercase', getTxColor(tx.type))}>
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(tx.timestamp), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium tabular-nums">
                          {formatNumber(tx.quantity)} {tx.assets.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @ {formatCurrency(tx.price)}
                        </div>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <div className="font-semibold tabular-nums">
                          {formatCurrency(tx.quantity * tx.price)}
                        </div>
                        {tx.fee && tx.fee > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Fee: {formatCurrency(tx.fee)}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteTransaction.mutate({ id: tx.id })}
                      >
                        <Trash2 className="w-4 h-4 text-loss" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No transactions yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-strong border-white/10">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Select a portfolio to view transactions</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
