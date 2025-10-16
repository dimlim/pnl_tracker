'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ArrowLeft, TrendingUp, TrendingDown, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface QuickAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2 | 3

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const [step, setStep] = useState<Step>(1)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [portfolioId, setPortfolioId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const utils = trpc.useUtils()
  const { data: assets, isLoading: assetsLoading } = trpc.assets.list.useQuery()
  const { data: portfolios } = trpc.portfolios.list.useQuery()

  const createTransaction = trpc.transactions.create.useMutation({
    onSuccess: () => {
      toast.success('Transaction added successfully', {
        description: `${transactionType === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${selectedAsset?.symbol}`
      })
      utils.transactions.listAll.invalidate()
      utils.positions.list.invalidate()
      utils.portfolios.listWithStats.invalidate()
      handleClose()
    },
    onError: (error) => {
      toast.error('Failed to add transaction', {
        description: error.message
      })
    },
  })

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1)
      setSelectedAsset(null)
      setTransactionType('buy')
      setQuantity('')
      setPrice('')
      setDate(new Date().toISOString().split('T')[0])
      
      // Set default portfolio
      if (portfolios && portfolios.length > 0 && !portfolioId) {
        setPortfolioId(portfolios[0].id)
      }
    }
  }, [open, portfolios, portfolioId])

  // Auto-fill price when asset selected
  useEffect(() => {
    if (selectedAsset?.current_price) {
      setPrice(selectedAsset.current_price.toString())
    }
  }, [selectedAsset])

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleNext = () => {
    if (step === 1 && !selectedAsset) {
      toast.error('Please select an asset')
      return
    }
    if (step < 3) {
      setStep((step + 1) as Step)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const handleSubmit = () => {
    if (!selectedAsset || !quantity || !price || !portfolioId) {
      toast.error('Please fill all fields')
      return
    }

    createTransaction.mutate({
      asset_id: selectedAsset.id,
      portfolio_id: portfolioId,
      type: transactionType,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fee: 0,
      timestamp: new Date(date).toISOString(),
    })
  }

  // Popular assets for quick access
  const popularAssets = assets?.filter(a => 
    ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'USDT', 'USDC'].includes(a.symbol)
  ) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Quick Add Transaction</span>
            <span className="text-sm font-normal text-muted-foreground">
              Step {step}/3
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1 flex-1 rounded-full transition-all',
                s <= step ? 'bg-primary' : 'bg-white/10'
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Asset */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <Label>Select Asset</Label>
                <Command className="rounded-lg border border-white/10 mt-2">
                  <CommandInput placeholder="Search assets..." />
                  <CommandList>
                    <CommandEmpty>No assets found.</CommandEmpty>
                    {popularAssets.length > 0 && (
                      <CommandGroup heading="Popular">
                        {popularAssets.map((asset) => (
                          <CommandItem
                            key={asset.id}
                            onSelect={() => {
                              setSelectedAsset(asset)
                              handleNext()
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <p className="font-semibold">{asset.symbol}</p>
                                <p className="text-xs text-muted-foreground">{asset.name}</p>
                              </div>
                              {asset.current_price && (
                                <p className="text-sm font-mono">${asset.current_price.toFixed(2)}</p>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    <CommandGroup heading="All Assets">
                      {assets?.map((asset) => (
                        <CommandItem
                          key={asset.id}
                          onSelect={() => {
                            setSelectedAsset(asset)
                            handleNext()
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <p className="font-semibold">{asset.symbol}</p>
                              <p className="text-xs text-muted-foreground">{asset.name}</p>
                            </div>
                            {asset.current_price && (
                              <p className="text-sm font-mono">${asset.current_price.toFixed(2)}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </motion.div>
          )}

          {/* Step 2: Buy or Sell */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Selected Asset</p>
                <p className="text-2xl font-bold">{selectedAsset?.symbol}</p>
                <p className="text-sm text-muted-foreground">{selectedAsset?.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={transactionType === 'buy' ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    'h-20 flex flex-col gap-2',
                    transactionType === 'buy' && 'bg-profit hover:bg-profit/90'
                  )}
                  onClick={() => {
                    setTransactionType('buy')
                    handleNext()
                  }}
                >
                  <TrendingUp className="w-6 h-6" />
                  <span>Buy</span>
                </Button>
                <Button
                  variant={transactionType === 'sell' ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    'h-20 flex flex-col gap-2',
                    transactionType === 'sell' && 'bg-loss hover:bg-loss/90'
                  )}
                  onClick={() => {
                    setTransactionType('sell')
                    handleNext()
                  }}
                >
                  <TrendingDown className="w-6 h-6" />
                  <span>Sell</span>
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Transaction Details */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {transactionType === 'buy' ? 'Buying' : 'Selling'}
                </p>
                <p className="text-2xl font-bold">{selectedAsset?.symbol}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="any"
                    placeholder="e.g., 1.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="any"
                    placeholder="e.g., 50000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="portfolio">Portfolio</Label>
                  <Select value={portfolioId} onValueChange={setPortfolioId}>
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
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={createTransaction.isPending}
                className="w-full"
                size="lg"
              >
                {createTransaction.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Add Transaction
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {step > 1 && step < 3 && (
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        )}
        {step === 3 && (
          <Button variant="outline" onClick={handleBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
