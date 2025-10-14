'use client'

import { useEffect, useRef } from 'react'

export function usePriceUpdates(intervalMs: number = 60000) {
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Update prices immediately on mount
    updatePrices()

    // Set up interval for periodic updates
    intervalRef.current = setInterval(() => {
      updatePrices()
    }, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [intervalMs])

  async function updatePrices() {
    try {
      const response = await fetch('/api/prices/update')
      if (!response.ok) {
        console.error('Failed to update prices:', response.statusText)
      }
    } catch (error) {
      console.error('Error updating prices:', error)
    }
  }

  return { updatePrices }
}
