'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { trpc } from '@/lib/trpc/client'

export function ImportTransactions() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const utils = trpc.useUtils()
  const createTransaction = trpc.transactions.create.useMutation()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setResult(null)

    try {
      const text = await selectedFile.text()
      let data: any[] = []

      if (selectedFile.name.endsWith('.json')) {
        data = JSON.parse(text)
      } else if (selectedFile.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        
        data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const obj: any = {}
          headers.forEach((header, i) => {
            obj[header.toLowerCase()] = values[i]
          })
          return obj
        })
      }

      setPreview(data.slice(0, 5)) // Show first 5 rows
    } catch (error) {
      console.error('Failed to parse file:', error)
      alert('Failed to parse file. Please check the format.')
      setFile(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    let success = 0
    let failed = 0

    try {
      const text = await file.text()
      let data: any[] = []

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text)
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
        
        data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const obj: any = {}
          headers.forEach((header, i) => {
            obj[header] = values[i]
          })
          return obj
        })
      }

      // Import each transaction
      for (const tx of data) {
        try {
          await createTransaction.mutateAsync({
            portfolio_id: tx.portfolio_id || tx.portfolioid,
            asset_id: parseInt(tx.asset_id || tx.assetid),
            type: tx.type,
            quantity: parseFloat(tx.quantity),
            price: parseFloat(tx.price),
            fee: parseFloat(tx.fee || 0),
            timestamp: new Date(tx.timestamp || tx.date).toISOString(),
            note: tx.notes || tx.note || null,
          })
          success++
        } catch (error) {
          console.error('Failed to import transaction:', error)
          failed++
        }
      }

      setResult({ success, failed })
      utils.transactions.list.invalidate()
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please check the file format.')
    } finally {
      setImporting(false)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setPreview([])
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetDialog()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file with your transactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {file ? file.name : 'Choose File'}
                </span>
              </Button>
            </label>
          </div>

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div className="border rounded-lg p-4 max-h-64 overflow-auto">
              <p className="text-sm font-semibold mb-2">Preview (first 5 rows):</p>
              <div className="space-y-2">
                {preview.map((tx, i) => (
                  <div key={i} className="text-xs bg-muted p-2 rounded">
                    {tx.type} - {tx.quantity} @ {tx.price}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-profit" />
                <span>{result.success} transactions imported successfully</span>
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-loss" />
                  <span>{result.failed} transactions failed</span>
                </div>
              )}
            </div>
          )}

          {/* Format Help */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">CSV Format:</p>
            <code className="block bg-muted p-2 rounded">
              date,type,asset,quantity,price,fee,portfolio,notes
            </code>
            <p className="font-semibold mt-2">JSON Format:</p>
            <code className="block bg-muted p-2 rounded">
              {`[{"type":"buy","quantity":1,"price":100,...}]`}
            </code>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing || !!result}
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
