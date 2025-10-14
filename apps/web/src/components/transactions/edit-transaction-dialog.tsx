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
import { Pencil, Loader2, Trash2 } from 'lucide-react'

interface EditTransactionDialogProps {
  transaction: any
  trigger?: React.ReactNode
}

export function EditTransactionDialog({ transaction, trigger }: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(transaction.quantity.toString())
  const [price, setPrice] = useState(transaction.price.toString())
  const [fee, setFee] = useState(transaction.fee?.toString() || '')
  const [note, setNote] = useState(transaction.note || '')
  const [timestamp, setTimestamp] = useState(
    new Date(transaction.timestamp).toISOString().slice(0, 16)
  )

  const utils = trpc.useUtils()
  
  const updateTransaction = trpc.transactions.update.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate()
      utils.positions.list.invalidate()
      utils.assets.getUserTransactions.invalidate()
      utils.assets.getStats.invalidate()
      utils.dashboard.getStats.invalidate()
      setOpen(false)
    },
  })

  const deleteTransaction = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate()
      utils.positions.list.invalidate()
      utils.assets.getUserTransactions.invalidate()
      utils.assets.getStats.invalidate()
      utils.dashboard.getStats.invalidate()
      setOpen(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updateTransaction.mutate({
      id: transaction.id,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fee: fee ? parseFloat(fee) : undefined,
      note: note || undefined,
      timestamp: new Date(timestamp).toISOString(),
    })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      deleteTransaction.mutate({ id: transaction.id })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md glass-strong border-white/10">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update transaction details or delete it
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
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

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTransaction.isPending || updateTransaction.isPending}
            >
              {deleteTransaction.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
            <div className="flex-1" />
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              disabled={updateTransaction.isPending || deleteTransaction.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateTransaction.isPending || deleteTransaction.isPending}
            >
              {updateTransaction.isPending ? (
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
  )
}
