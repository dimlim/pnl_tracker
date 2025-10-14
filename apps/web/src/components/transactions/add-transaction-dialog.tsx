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
import { Plus, Loader2, Search } from 'lucide-react'

interface AddTransactionDialogProps {
  portfolioId: string
  trigger?: React.ReactNode
}

export function AddTransactionDialog({ portfolioId, trigger }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'buy' | 'sell' | 'transfer_in' | 'transfer_out'>('buy')
  const [selectedAsset, setSelectedAsset] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fee, setFee] = useState('')
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16))

  const utils = trpc.useUtils()
  const { data: assets } = trpc.assets.list.useQuery()
  
  // Filter assets based on search query
  const filteredAssets = assets?.filter((a: any) => 
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const createTransaction = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate()
      utils.positions.list.invalidate()
      setOpen(false)
      // Reset form
      setSelectedAsset('')
      setQuantity('')
      setPrice('')
      setFee('')
      setTimestamp(new Date().toISOString().slice(0, 16))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTransaction.mutate({
      portfolio_id: portfolioId,
      asset_id: parseInt(selectedAsset),
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fee: fee ? parseFloat(fee) : undefined,
      timestamp: new Date(timestamp).toISOString(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Record a new transaction for this portfolio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset">Asset</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Type to search crypto (e.g. BTC, Bitcoin)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              {searchQuery && filteredAssets && filteredAssets.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto border border-white/10 rounded-lg bg-background">
                  {filteredAssets.slice(0, 10).map((a: any) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedAsset(a.id.toString())
                        setSearchQuery(a.symbol)
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                    >
                      {a.icon_url ? (
                        <img src={a.icon_url} alt={a.symbol} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                          {a.symbol.slice(0, 1)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{a.symbol}</div>
                        <div className="text-sm text-muted-foreground">{a.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && filteredAssets && filteredAssets.length === 0 && (
                <div className="p-3 text-center text-sm text-muted-foreground border border-white/10 rounded-lg">
                  No crypto found for &quot;{searchQuery}&quot;
                </div>
              )}
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
  )
}
