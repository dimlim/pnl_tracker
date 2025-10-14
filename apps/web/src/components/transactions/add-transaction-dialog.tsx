'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Loader2, Search, X } from 'lucide-react'

interface AddTransactionDialogProps {
  portfolioId?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddTransactionDialog({ portfolioId, trigger, open: externalOpen, onOpenChange }: AddTransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [type, setType] = useState<'buy' | 'sell' | 'transfer_in' | 'transfer_out'>('buy')
  const [selectedAsset, setSelectedAsset] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fee, setFee] = useState('')
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16))
  const [coingeckoResults, setCoingeckoResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddingAsset, setIsAddingAsset] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState(portfolioId || '')

  const utils = trpc.useUtils()
  const { data: assets } = trpc.assets.list.useQuery()
  const { data: portfolios } = trpc.portfolios.list.useQuery()
  
  // Filter local assets
  const filteredLocalAssets = assets
    ?.filter((a: any) => 
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      const query = searchQuery.toLowerCase()
      const aSymbol = a.symbol.toLowerCase()
      const bSymbol = b.symbol.toLowerCase()
      
      if (aSymbol === query) return -1
      if (bSymbol === query) return 1
      if (aSymbol.startsWith(query) && !bSymbol.startsWith(query)) return -1
      if (bSymbol.startsWith(query) && !aSymbol.startsWith(query)) return 1
      return aSymbol.localeCompare(bSymbol)
    }) || []

  // Search CoinGecko when query changes
  useEffect(() => {
    const searchCoinGecko = async () => {
      if (searchQuery.length < 2) {
        setCoingeckoResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/crypto/search?query=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setCoingeckoResults(data.results || [])
      } catch (error) {
        console.error('Search error:', error)
        setCoingeckoResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchCoinGecko, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  // Add asset from CoinGecko
  const handleAddAsset = async (coingeckoId: string) => {
    setIsAddingAsset(true)
    try {
      console.log('Adding asset from CoinGecko:', coingeckoId)
      const response = await fetch('/api/crypto/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coingeckoId }),
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (!response.ok) {
        console.error('Server error:', response.status, data)
        alert(`Failed to add asset: ${data.error || 'Server error'}`)
        return
      }
      
      if (data.success && data.asset) {
        // Update the cache with the new asset
        const currentAssets = utils.assets.list.getData() || []
        utils.assets.list.setData(undefined, [...currentAssets, data.asset])
        
        // Select the new asset immediately
        setSelectedAsset(data.asset.id.toString())
        setSearchQuery('')
        setCoingeckoResults([])
        console.log('Asset added successfully:', data.asset)
      } else {
        console.error('Failed to add asset:', data)
        alert('Failed to add asset. Please try again.')
      }
    } catch (error) {
      console.error('Add asset error:', error)
      alert('Network error. Please check your connection.')
    } finally {
      setIsAddingAsset(false)
    }
  }
  
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
    if (!selectedPortfolio || !selectedAsset) return
    
    createTransaction.mutate({
      portfolio_id: selectedPortfolio,
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
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && !externalOpen && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              {portfolioId ? 'Record a new transaction for this portfolio' : 'Record a new crypto transaction'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!portfolioId && (
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
            )}

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
              {selectedAsset ? (
                <div className="flex items-center gap-2 p-3 border border-white/10 rounded-lg bg-white/5">
                  {assets?.find((a: any) => a.id.toString() === selectedAsset)?.icon_url ? (
                    <img 
                      src={assets?.find((a: any) => a.id.toString() === selectedAsset)?.icon_url} 
                      alt="icon" 
                      className="w-6 h-6 rounded-full" 
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                      {assets?.find((a: any) => a.id.toString() === selectedAsset)?.symbol[0]}
                    </div>
                  )}
                  <span className="font-medium flex-1">
                    {assets?.find((a: any) => a.id.toString() === selectedAsset)?.symbol}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAsset('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Type to search crypto (e.g. BTC, Bitcoin)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
              {searchQuery && (filteredLocalAssets.length > 0 || coingeckoResults.length > 0 || isSearching) && (
                <div className="max-h-[300px] overflow-y-auto border border-white/10 rounded-lg bg-background">
                  {/* Local assets */}
                  {filteredLocalAssets.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs uppercase text-muted-foreground bg-white/5">
                        Your Assets
                      </div>
                      {filteredLocalAssets.slice(0, 5).map((a: any) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedAsset(a.id.toString())
                            setSearchQuery('')
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
                    </>
                  )}

                  {/* CoinGecko results */}
                  {coingeckoResults.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs uppercase text-muted-foreground bg-white/5">
                        Add from CoinGecko
                      </div>
                      {coingeckoResults.map((coin: any) => (
                        <button
                          key={coin.id}
                          type="button"
                          onClick={() => handleAddAsset(coin.id)}
                          disabled={isAddingAsset}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                        >
                          {coin.thumb ? (
                            <img src={coin.thumb} alt={coin.symbol} className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                              {coin.symbol.slice(0, 1)}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{coin.symbol}</div>
                            <div className="text-sm text-muted-foreground">{coin.name}</div>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </>
                  )}

                  {/* Loading */}
                  {isSearching && (
                    <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </div>
                  )}
                </div>
              )}
              {searchQuery && !isSearching && filteredLocalAssets.length === 0 && coingeckoResults.length === 0 && (
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
