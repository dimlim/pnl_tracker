'use client'

import { useState, useCallback } from 'react'

export function useBulkSelection<T extends { id: string | number }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

  const toggleSelection = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item.id)))
  }, [items])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback(
    (id: string | number) => selectedIds.has(id),
    [selectedIds]
  )

  const getSelectedItems = useCallback(() => {
    return items.filter((item) => selectedIds.has(item.id))
  }, [items, selectedIds])

  const selectedCount = selectedIds.size

  return {
    selectedIds,
    selectedCount,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    getSelectedItems,
  }
}
