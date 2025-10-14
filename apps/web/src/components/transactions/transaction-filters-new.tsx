'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TransactionFiltersProps {
  onFilterChange: (filters: FilterState) => void
  onSortChange?: (sort: SortState) => void
  onExport?: () => void
  showExport?: boolean
}

export interface FilterState {
  type: string[]
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
}

export interface SortState {
  field: 'date' | 'amount' | 'type' | 'roi'
  direction: 'asc' | 'desc'
}

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdraw', label: 'Withdraw' },
  { value: 'airdrop', label: 'Airdrop' },
]

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'type', label: 'Type' },
  { value: 'roi', label: 'ROI' },
]

export function TransactionFilters({ 
  onFilterChange,
  onSortChange,
  onExport,
  showExport = true 
}: TransactionFiltersProps) {
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc',
  })

  const handleTypeChange = (value: string) => {
    setSelectedType(value)
    const newFilters: FilterState = {
      type: value === 'all' ? [] : [value],
    }
    onFilterChange(newFilters)
  }

  const handleSortFieldChange = (field: string) => {
    const newSort: SortState = {
      field: field as SortState['field'],
      direction: sort.direction,
    }
    setSort(newSort)
    onSortChange?.(newSort)
  }

  const toggleSortDirection = () => {
    const newSort: SortState = {
      field: sort.field,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    }
    setSort(newSort)
    onSortChange?.(newSort)
  }

  const clearFilters = () => {
    setSelectedType('all')
    onFilterChange({ type: [] })
  }

  const hasActiveFilters = selectedType !== 'all'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Type Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Type:</span>
        <Select value={selectedType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[160px] h-9 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10">
            {TRANSACTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Sort:</span>
        <Select value={sort.field} onValueChange={handleSortFieldChange}>
          <SelectTrigger className="w-[120px] h-9 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10">
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSortDirection}
          className="h-9 w-9 p-0 bg-white/5 border-white/10"
          title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sort.direction === 'asc' ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 gap-2"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export */}
      {showExport && onExport && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-9 gap-2 bg-white/5 border-white/10"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      )}
    </div>
  )
}
