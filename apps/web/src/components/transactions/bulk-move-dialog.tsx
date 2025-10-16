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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BulkMoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionIds: number[]
  onSuccess: () => void
}

export function BulkMoveDialog({
  open,
  onOpenChange,
  transactionIds,
  onSuccess,
}: BulkMoveDialogProps) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('')
  
  const { data: portfolios, isLoading: portfoliosLoading } = trpc.portfolios.list.useQuery()
  const utils = trpc.useUtils()

  const bulkMove = trpc.transactions.bulkMove.useMutation({
    onSuccess: (data) => {
      toast.success('Transactions moved successfully', {
        description: `${data.count} ${data.count === 1 ? 'transaction' : 'transactions'} moved`
      })
      utils.transactions.list.invalidate()
      utils.transactions.listAll.invalidate()
      utils.portfolios.listWithStats.invalidate()
      onSuccess()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to move transactions', {
        description: error.message
      })
    },
  })

  const handleMove = () => {
    if (!selectedPortfolioId) {
      toast.error('Please select a portfolio')
      return
    }

    bulkMove.mutate({
      ids: transactionIds,
      targetPortfolioId: selectedPortfolioId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Transactions</DialogTitle>
          <DialogDescription>
            Move {transactionIds.length} {transactionIds.length === 1 ? 'transaction' : 'transactions'} to another portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            Target Portfolio
          </label>
          {portfoliosLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select
              value={selectedPortfolioId}
              onValueChange={setSelectedPortfolioId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select portfolio..." />
              </SelectTrigger>
              <SelectContent>
                {portfolios?.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={bulkMove.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedPortfolioId || bulkMove.isPending}
          >
            {bulkMove.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Moving...
              </>
            ) : (
              'Move Transactions'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
