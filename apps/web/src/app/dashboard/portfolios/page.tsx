'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Wallet, Loader2 } from 'lucide-react'
import { PortfolioCard } from '@/components/portfolio/portfolio-card'

export default function PortfoliosPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [pnlMethod, setPnlMethod] = useState<'fifo' | 'lifo' | 'avg'>('fifo')
  const [includeFees, setIncludeFees] = useState(true)

  const utils = trpc.useUtils()
  const { data: portfolios, isLoading } = trpc.portfolios.list.useQuery()
  const createPortfolio = trpc.portfolios.create.useMutation({
    onSuccess: () => {
      utils.portfolios.list.invalidate()
      setDialogOpen(false)
      setName('')
    },
    onError: (error) => {
      console.error('Failed to create portfolio:', error)
      alert(`Error: ${error.message}`)
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createPortfolio.mutate({
      name,
      base_currency: baseCurrency,
      pnl_method: pnlMethod,
      include_fees: includeFees,
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Portfolios</h1>
          <p className="text-muted-foreground mt-2">Manage your crypto portfolios</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Portfolio</DialogTitle>
                <DialogDescription>
                  Set up a new portfolio to track your crypto investments
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Portfolio Name</Label>
                  <Input
                    id="name"
                    placeholder="My Portfolio"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">PnL Method</Label>
                  <Select value={pnlMethod} onValueChange={(v: any) => setPnlMethod(v)}>
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
                    id="fees"
                    checked={includeFees}
                    onChange={(e) => setIncludeFees(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <Label htmlFor="fees" className="cursor-pointer">
                    Include fees in calculations
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createPortfolio.isPending}>
                  {createPortfolio.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Portfolio'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolios Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 glass rounded-xl animate-pulse" />
          ))}
        </div>
      ) : portfolios && portfolios.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      ) : (
        <Card className="glass-strong border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No portfolios yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first portfolio to start tracking your crypto investments
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
