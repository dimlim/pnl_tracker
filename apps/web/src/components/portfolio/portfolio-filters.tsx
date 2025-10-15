'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface PortfolioFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy: 'value' | 'roi' | 'name' | 'updated'
  onSortChange: (value: 'value' | 'roi' | 'name' | 'updated') => void
  currencyFilter: string
  onCurrencyFilterChange: (value: string) => void
  currencies: string[]
}

export function PortfolioFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  currencyFilter,
  onCurrencyFilterChange,
  currencies,
}: PortfolioFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search portfolios..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sort By */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="value">Sort by Value</SelectItem>
          <SelectItem value="roi">Sort by ROI</SelectItem>
          <SelectItem value="name">Sort by Name</SelectItem>
          <SelectItem value="updated">Sort by Updated</SelectItem>
        </SelectContent>
      </Select>

      {/* Currency Filter */}
      {currencies.length > 1 && (
        <Select value={currencyFilter} onValueChange={onCurrencyFilterChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All currencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All currencies</SelectItem>
            {currencies.map((currency) => (
              <SelectItem key={currency} value={currency}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
