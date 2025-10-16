'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { trpc } from '@/lib/trpc/client'

interface ExportTransactionsProps {
  portfolioId?: string
}

export function ExportTransactions({ portfolioId }: ExportTransactionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const utils = trpc.useUtils()

  const exportToCSV = async () => {
    setIsExporting(true)

    try {
      // Fetch transactions
      const transactions = portfolioId
        ? await utils.transactions.list.fetch({ portfolio_id: portfolioId })
        : await utils.transactions.listAll.fetch()

      if (!transactions || transactions.length === 0) {
        toast.error('No transactions to export')
        setIsExporting(false)
        return
      }

      // CSV Headers
      const headers = [
        'Date',
        'Type',
        'Symbol',
        'Asset Name',
        'Quantity',
        'Price',
        'Fee',
        'Total',
        'Portfolio',
        'Notes',
      ]

      // CSV Rows
      const rows = transactions.map((tx: any) => [
        new Date(tx.timestamp).toISOString(),
        tx.type,
        tx.assets?.symbol || '',
        tx.assets?.name || '',
        tx.quantity,
        tx.price,
        tx.fee || 0,
        tx.quantity * tx.price + (tx.fee || 0),
        tx.portfolios?.name || '',
        tx.note || '',
      ])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(',')),
      ].join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export transactions')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJSON = async () => {
    setIsExporting(true)

    try {
      // Fetch transactions
      const transactions = portfolioId
        ? await utils.transactions.list.fetch({ portfolio_id: portfolioId })
        : await utils.transactions.listAll.fetch()

      if (!transactions || transactions.length === 0) {
        toast.error('No transactions to export')
        setIsExporting(false)
        return
      }

      const jsonContent = JSON.stringify(transactions, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${Date.now()}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export transactions')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
