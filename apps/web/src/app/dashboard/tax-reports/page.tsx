'use client'

import { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { Download, FileText, Lock, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

export default function TaxReportsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [isPremium] = useState(false) // TODO: Connect to subscription system

  const { data: transactions } = trpc.transactions.listAll.useQuery()
  const { data: portfolios } = trpc.portfolios.listWithStats.useQuery()

  // Calculate tax report
  const taxReport = useMemo(() => {
    if (!transactions) return null

    const year = parseInt(selectedYear)
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59)

    // Filter transactions for the year
    const yearTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.timestamp)
      return txDate >= yearStart && txDate <= yearEnd
    })

    // Calculate capital gains/losses using FIFO
    let shortTermGains = 0
    let longTermGains = 0
    let totalProceeds = 0
    let totalCostBasis = 0

    const holdings = new Map<number, Array<{ quantity: number, price: number, date: Date }>>()

    yearTransactions.forEach(tx => {
      if (tx.type === 'buy') {
        const existing = holdings.get(tx.asset_id) || []
        existing.push({
          quantity: tx.quantity,
          price: tx.price,
          date: new Date(tx.timestamp)
        })
        holdings.set(tx.asset_id, existing)
      } else if (tx.type === 'sell') {
        const lots = holdings.get(tx.asset_id) || []
        let remainingToSell = tx.quantity
        let costBasis = 0

        while (remainingToSell > 0 && lots.length > 0) {
          const lot = lots[0]
          const sellQuantity = Math.min(lot.quantity, remainingToSell)
          
          costBasis += sellQuantity * lot.price
          const proceeds = sellQuantity * tx.price
          const gain = proceeds - (sellQuantity * lot.price)

          // Check if long-term (>1 year) or short-term
          const holdingPeriod = (new Date(tx.timestamp).getTime() - lot.date.getTime()) / (1000 * 60 * 60 * 24)
          if (holdingPeriod > 365) {
            longTermGains += gain
          } else {
            shortTermGains += gain
          }

          totalProceeds += proceeds
          totalCostBasis += sellQuantity * lot.price

          lot.quantity -= sellQuantity
          remainingToSell -= sellQuantity

          if (lot.quantity === 0) {
            lots.shift()
          }
        }

        holdings.set(tx.asset_id, lots)
      }
    })

    return {
      year,
      shortTermGains,
      longTermGains,
      totalGains: shortTermGains + longTermGains,
      totalProceeds,
      totalCostBasis,
      transactionCount: yearTransactions.length,
      sellTransactions: yearTransactions.filter(tx => tx.type === 'sell').length,
    }
  }, [transactions, selectedYear])

  const availableYears = useMemo(() => {
    if (!transactions || transactions.length === 0) return [new Date().getFullYear().toString()]
    
    const years = new Set<number>()
    transactions.forEach(tx => {
      years.add(new Date(tx.timestamp).getFullYear())
    })
    
    return Array.from(years).sort((a, b) => b - a).map(y => y.toString())
  }, [transactions])

  const handleExportPDF = () => {
    if (!isPremium) {
      alert('Premium feature! Upgrade to export tax reports.')
      return
    }
    // TODO: Implement PDF export
  }

  const handleExportCSV = () => {
    if (!isPremium) {
      alert('Premium feature! Upgrade to export tax reports.')
      return
    }
    // TODO: Implement CSV export
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Tax Reports</h1>
          <p className="text-muted-foreground mt-2">Capital gains and tax summaries</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isPremium && (
        <Card className="glass-strong border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Premium Feature</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Premium to export tax reports, get detailed breakdowns, and access advanced tax tools.
                </p>
                <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
                  Upgrade to Premium - $9.99/month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {taxReport && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capital Gains</CardTitle>
              {taxReport.totalGains >= 0 ? (
                <TrendingUp className="h-4 w-4 text-profit" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss" />
              )}
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold tabular-nums",
                taxReport.totalGains >= 0 ? "text-profit" : "text-loss"
              )}>
                {formatCurrency(taxReport.totalGains)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                For tax year {taxReport.year}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Short-Term Gains</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold tabular-nums",
                taxReport.shortTermGains >= 0 ? "text-profit" : "text-loss"
              )}>
                {formatCurrency(taxReport.shortTermGains)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Held ≤ 1 year
              </p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Long-Term Gains</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold tabular-nums",
                taxReport.longTermGains >= 0 ? "text-profit" : "text-loss"
              )}>
                {formatCurrency(taxReport.longTermGains)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Held &gt; 1 year
              </p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {taxReport.sellTransactions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxable events
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Breakdown */}
      {taxReport && (
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tax Summary {taxReport.year}</CardTitle>
                <CardDescription>
                  Detailed breakdown of capital gains and losses
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={!isPremium}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={!isPremium}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Proceeds</p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(taxReport.totalProceeds)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Cost Basis</p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(taxReport.totalCostBasis)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <h4 className="font-semibold mb-3">Important Notes</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• This report uses FIFO (First In, First Out) method for cost basis calculation</li>
                  <li>• Short-term gains (held ≤ 1 year) are taxed as ordinary income</li>
                  <li>• Long-term gains (held &gt; 1 year) qualify for preferential tax rates</li>
                  <li>• Consult with a tax professional for accurate tax filing</li>
                  <li>• This is for informational purposes only and not tax advice</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
