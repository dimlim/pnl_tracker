'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
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
import { Plus, Loader2 } from 'lucide-react'

interface AddAssetTransactionDialogProps {
  assetId: number
  assetSymbol: string
  trigger?: React.ReactNode
}

export function AddAssetTransactionDialog({ assetId, assetSymbol, trigger }: AddAssetTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'deposit' | 'withdraw' | 'airdrop'>('buy')
  const [selectedPortfolio, setSelectedPortfolio] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fee, setFee] = useState('')
  const [note, setNote] = useState('')
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16))

  const utils = trpc.useUtils()
  const { data: portfolios } = trpc.portfolios.list.useQuery()
  
  const createTransaction = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate()
      utils.positions.list.invalidate()
      utils.assets.getUserTransactions.invalidate()
      utils.assets.getStats.invalidate()
      utils.dashboard.getStats.invalidate()
      setOpen(false)
      // Reset form
      setQuantity('')
      setPrice('')
      setFee('')
      setNote('')
      setTimestamp(new Date().toISOString().slice(0, 16))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPortfolio) return
    
    createTransaction.mutate({
      portfolio_id: selectedPortfolio,
      asset_id: assetId,
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fee: fee ? parseFloat(fee) : undefined,
      note: note || undefined,
      timestamp: new Date(timestamp).toISOString(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="glass-strong">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md glass-strong border-white/10">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add {assetSymbol} Transaction</DialogTitle>
            <DialogDescription>
              Record a new transaction for {assetSymbol}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio</Label>
              <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="transfer_in">Transfer In</SelectItem>
                  <SelectItem value="transfer_out">Transfer Out</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdraw">Withdraw</SelectItem>
                  <SelectItem value="airdrop">Airdrop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="price">Price (USD)</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">Fee (USD, optional)</Label>
              <Input
                id="fee"
                type="number"
                step="any"
                placeholder="0.00"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
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

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                type="text"
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              disabled={createTransaction.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTransaction.isPending || !selectedPortfolio}>
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
  )
}
