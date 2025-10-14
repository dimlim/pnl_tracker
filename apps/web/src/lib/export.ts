import { format } from 'date-fns'

interface Transaction {
  id: number
  timestamp: string | Date
  type: string
  quantity: number
  price: number
  fee?: number
  notes?: string
  asset?: {
    symbol: string
    name: string
  }
  portfolio?: {
    name: string
  }
}

/**
 * Convert transactions to CSV format
 */
export function transactionsToCSV(transactions: Transaction[]): string {
  const headers = [
    'Date',
    'Time',
    'Asset',
    'Asset Name',
    'Portfolio',
    'Type',
    'Quantity',
    'Price (USD)',
    'Fee (USD)',
    'Total (USD)',
    'Notes',
  ]

  const rows = transactions.map((tx) => {
    const date = new Date(tx.timestamp)
    const total = tx.quantity * tx.price
    
    return [
      format(date, 'yyyy-MM-dd'),
      format(date, 'HH:mm:ss'),
      tx.asset?.symbol || '',
      tx.asset?.name || '',
      tx.portfolio?.name || '',
      tx.type.toUpperCase(),
      tx.quantity.toString(),
      tx.price.toString(),
      (tx.fee || 0).toString(),
      total.toString(),
      tx.notes || '',
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Export transactions to CSV file
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  filename?: string
) {
  const csv = transactionsToCSV(transactions)
  const defaultFilename = `crypto-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
  downloadCSV(csv, filename || defaultFilename)
}

/**
 * Export to Excel-compatible CSV (with BOM for proper encoding)
 */
export function exportTransactionsToExcel(
  transactions: Transaction[],
  filename?: string
) {
  const csv = transactionsToCSV(transactions)
  // Add BOM for Excel to recognize UTF-8
  const csvWithBOM = '\uFEFF' + csv
  const defaultFilename = `crypto-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
  downloadCSV(csvWithBOM, filename || defaultFilename)
}
