'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SeedPricesButton({ assetId }: { assetId?: number }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleSeed = async () => {
    setLoading(true)
    setResult('')

    try {
      const url = assetId 
        ? `/api/prices/seed-history?assetId=${assetId}&days=30`
        : '/api/prices/seed-history?days=30'
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        const successCount = data.results.filter((r: any) => r.status === 'success').length
        setResult(`✓ Successfully seeded ${successCount} assets`)
      } else {
        setResult('✗ Failed to seed prices')
      }
    } catch (error) {
      setResult('✗ Error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleSeed}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {loading ? 'Seeding...' : 'Seed Price History'}
      </Button>
      {result && (
        <p className={`text-sm ${result.startsWith('✓') ? 'text-profit' : 'text-loss'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
