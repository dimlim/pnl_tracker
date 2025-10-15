'use client'

import { useState, useMemo } from 'react'
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
import { PortfolioCardUnified } from '@/components/portfolio/portfolio-card-unified'
import { PortfolioSummaryBar } from '@/components/portfolio/portfolio-summary-bar'
import { PortfolioFilters } from '@/components/portfolio/portfolio-filters'

export default function PortfoliosPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [pnlMethod, setPnlMethod] = useState<'fifo' | 'lifo' | 'avg'>('fifo')
  const [includeFees, setIncludeFees] = useState(true)
  
  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'value' | 'roi' | 'name' | 'updated'>('value')
  const [currencyFilter, setCurrencyFilter] = useState('all')

  const utils = trpc.useUtils()
  const { data: portfolios, isLoading } = trpc.portfolios.listWithStats.useQuery()
  
  const createPortfolio = trpc.portfolios.create.useMutation({
    onSuccess: () => {
      utils.portfolios.listWithStats.invalidate()
      setDialogOpen(false)
      setName('')
    },
    onError: (error) => {
      console.error('Failed to create portfolio:', error)
      alert(`Error: ${error.message}`)
    },
  })

  const deletePortfolio = trpc.portfolios.delete.useMutation({
    onSuccess: () => {
      utils.portfolios.listWithStats.invalidate()
    },
    onError: (error) => {
      console.error('Failed to delete portfolio:', error)
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

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!portfolios || portfolios.length === 0) {
      return {
        totalValue: 0,
        totalPnL: 0,
        pnlPercent: 0,
        portfolioCount: 0,
        dayChange: 0,
        dayChangePercent: 0,
      }
    }

    const totalValue = portfolios.reduce((sum: number, p: any) => sum + (p.stats?.totalValue || 0), 0)
    const totalPnL = portfolios.reduce((sum: number, p: any) => sum + (p.stats?.totalPnL || 0), 0)
    const totalInvested = totalValue - totalPnL
    const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
    const dayChange = portfolios.reduce((sum: number, p: any) => sum + (p.stats?.dayChange || 0), 0)
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0

    return {
      totalValue,
      totalPnL,
      pnlPercent,
      portfolioCount: portfolios.length,
      dayChange,
      dayChangePercent,
    }
  }, [portfolios])

  // Get unique currencies
  const currencies = useMemo(() => {
    if (!portfolios) return []
    return Array.from(new Set(portfolios.map((p: any) => p.base_currency)))
  }, [portfolios])

  // Filter and sort portfolios
  const filteredPortfolios = useMemo(() => {
    if (!portfolios) return []

    let filtered = portfolios.filter((p: any) => {
      // Search filter
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Currency filter
      if (currencyFilter !== 'all' && p.base_currency !== currencyFilter) {
        return false
      }
      return true
    })

    // Sort
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'value':
          return (b.stats?.totalValue || 0) - (a.stats?.totalValue || 0)
        case 'roi':
          return (b.stats?.pnlPercent || 0) - (a.stats?.pnlPercent || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'updated':
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [portfolios, searchQuery, currencyFilter, sortBy])

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
                  <Select value={baseCurrency} onValueChange={setBaseCurrency} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    All prices and values are displayed in USD
                  </p>
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

      {/* Summary Bar */}
      {!isLoading && portfolios && portfolios.length > 0 && (
        <PortfolioSummaryBar {...summaryStats} />
      )}

      {/* Filters */}
      {!isLoading && portfolios && portfolios.length > 0 && (
        <PortfolioFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          currencyFilter={currencyFilter}
          onCurrencyFilterChange={setCurrencyFilter}
          currencies={currencies}
        />
      )}

      {/* Portfolios Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 glass rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredPortfolios && filteredPortfolios.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPortfolios.map((portfolio: any, index) => (
            <PortfolioCardUnified 
              key={portfolio.id} 
              portfolio={portfolio}
              stats={portfolio.stats || {
                totalValue: 0,
                totalPnL: 0,
                pnlPercent: 0,
                assetCount: 0,
              }}
              topAssets={portfolio.topAssets}
              sparklineData={[100, 105, 103, 108, 112, 110, 115]} // Mock data
              index={index}
              onEdit={() => window.location.href = `/dashboard/portfolios/${portfolio.id}`}
              onDelete={() => {
                if (confirm(`Delete portfolio "${portfolio.name}"? This action cannot be undone.`)) {
                  deletePortfolio.mutate({ id: portfolio.id })
                }
              }}
              onDuplicate={() => {
                const newName = prompt('Enter name for duplicated portfolio:', `${portfolio.name} (Copy)`)
                if (newName) {
                  createPortfolio.mutate({
                    name: newName,
                    base_currency: portfolio.base_currency,
                    pnl_method: portfolio.pnl_method,
                    include_fees: portfolio.include_fees || true,
                  })
                }
              }}
              onExport={() => {
                // Export portfolio transactions as CSV
                const csv = `Portfolio: ${portfolio.name}\nMethod: ${portfolio.pnl_method}\nCurrency: ${portfolio.base_currency}\n\nExport functionality coming soon!`
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${portfolio.name.replace(/\s+/g, '_')}_export.csv`
                a.click()
              }}
            />
          ))}
        </div>
      ) : portfolios && portfolios.length > 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No portfolios match your filters</p>
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
