'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Star, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CryptoIcon } from '@/components/ui/crypto-icon'
import { trpc } from '@/lib/trpc'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const utils = trpc.useUtils()

  const { data: results, isLoading, error } = trpc.markets.search.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length > 0,
    }
  )

  // Log search results
  useEffect(() => {
    if (results) {
      console.log('🔍 Search results for', debouncedQuery, ':', results)
    }
    if (error) {
      console.error('❌ Search error:', error)
    }
  }, [results, error, debouncedQuery])

  const toggleWatchlist = trpc.markets.toggleWatchlist.useMutation({
    onSuccess: (data) => {
      toast.success(data.added ? 'Added to watchlist' : 'Removed from watchlist')
      utils.markets.search.invalidate()
      utils.markets.getAll.invalidate()
      utils.markets.getWatchlistCount.invalidate()
    },
    onError: () => {
      toast.error('Failed to update watchlist')
    },
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Open dropdown when there are results or when searching
  useEffect(() => {
    if (debouncedQuery && (results || isLoading)) {
      setIsOpen(true)
    }
  }, [results, isLoading, debouncedQuery])

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        placeholder="Search all cryptocurrencies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setIsOpen(true)}
        className="pl-10"
      />

      {/* Search Results Dropdown */}
      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-[400px] overflow-y-auto z-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Found {results.length} results
              </div>
              {results.map((coin: any) => (
                <div
                  key={coin.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Icon with fallback */}
                    {coin.iconUrl ? (
                      <img 
                        src={coin.iconUrl} 
                        alt={coin.symbol}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          // Fallback to CryptoIcon if image fails
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'block'
                        }}
                      />
                    ) : null}
                    <div style={{ display: coin.iconUrl ? 'none' : 'block' }}>
                      <CryptoIcon symbol={coin.symbol} size={32} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{coin.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="font-mono">{coin.symbol}</span>
                        {coin.rank !== 999999 && (
                          <span className="text-xs">#{coin.rank}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWatchlist.mutate({ assetId: coin.id })}
                    disabled={toggleWatchlist.isPending}
                  >
                    <Star
                      className={cn(
                        'w-4 h-4',
                        coin.isWatchlisted &&
                          'fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500'
                      )}
                    />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-2">
                No cryptocurrencies found for &quot;{query}&quot;
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Try searching by full name or different spelling
              </div>
              {error && (
                <div className="mt-2 text-xs text-red-500">
                  Error: {error.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
