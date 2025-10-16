'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Filter, X, Download, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'

interface TransactionFiltersProps {
  onFilterChange: (filters: FilterState) => void
  onExport?: () => void
  showExport?: boolean
}

export interface FilterState {
  type: string[]
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
  pnlFilter?: 'all' | 'profit' | 'loss' | 'breakeven'
  search?: string
}

const TRANSACTION_TYPES = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdraw', label: 'Withdraw' },
  { value: 'airdrop', label: 'Airdrop' },
]

export function TransactionFilters({ 
  onFilterChange, 
  onExport,
  showExport = true 
}: TransactionFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    type: [],
    pnlFilter: 'all',
  })

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.type.includes(type)
      ? filters.type.filter(t => t !== type)
      : [...filters.type, type]
    
    const newFilters = { ...filters, type: newTypes }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    const newFilters = {
      ...filters,
      [field]: value ? new Date(value) : undefined,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleAmountChange = (field: 'minAmount' | 'maxAmount', value: string) => {
    const newFilters = {
      ...filters,
      [field]: value ? parseFloat(value) : undefined,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const newFilters: FilterState = { type: [], pnlFilter: 'all' }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const newFilters = {
      ...filters,
      dateFrom: range?.from,
      dateTo: range?.to,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handlePnLFilterChange = (value: 'all' | 'profit' | 'loss' | 'breakeven') => {
    const newFilters = { ...filters, pnlFilter: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const hasActiveFilters = 
    filters.type.length > 0 || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.minAmount !== undefined || 
    filters.maxAmount !== undefined ||
    (filters.pnlFilter && filters.pnlFilter !== 'all') ||
    (filters.search && filters.search.length > 0)

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by asset name or symbol..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
              {filters.type.length + 
                (filters.dateFrom ? 1 : 0) + 
                (filters.dateTo ? 1 : 0) + 
                (filters.minAmount !== undefined ? 1 : 0) + 
                (filters.maxAmount !== undefined ? 1 : 0)}
            </span>
          )}
        </Button>

        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
          {showExport && onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="glass-strong border-white/10">
          <CardContent className="pt-6 space-y-4">
            {/* Transaction Types */}
            <div>
              <label className="text-sm font-medium mb-2 block">Transaction Type</label>
              <div className="flex flex-wrap gap-2">
                {TRANSACTION_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleTypeToggle(value)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      filters.type.includes(value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DateRangePicker
                value={{ from: filters.dateFrom, to: filters.dateTo }}
                onChange={handleDateRangeChange}
              />
            </div>

            {/* P&L Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Profit/Loss</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePnLFilterChange('all')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
                    filters.pnlFilter === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => handlePnLFilterChange('profit')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
                    filters.pnlFilter === 'profit'
                      ? 'bg-profit text-white'
                      : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Profit
                </button>
                <button
                  onClick={() => handlePnLFilterChange('loss')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
                    filters.pnlFilter === 'loss'
                      ? 'bg-loss text-white'
                      : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                  )}
                >
                  <TrendingDown className="w-4 h-4" />
                  Loss
                </button>
                <button
                  onClick={() => handlePnLFilterChange('breakeven')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
                    filters.pnlFilter === 'breakeven'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                  )}
                >
                  <Minus className="w-4 h-4" />
                  Break-even
                </button>
              </div>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Min Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.minAmount ?? ''}
                  onChange={(e) => handleAmountChange('minAmount', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Max Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.maxAmount ?? ''}
                  onChange={(e) => handleAmountChange('maxAmount', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function format(date: Date, formatStr: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  if (formatStr === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`
  }
  
  return date.toISOString()
}
