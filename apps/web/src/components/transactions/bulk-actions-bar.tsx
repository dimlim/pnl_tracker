'use client'

import { Button } from '@/components/ui/button'
import { 
  Trash2, 
  FolderInput, 
  Download, 
  X,
  CheckSquare,
  Square
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkActionsBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onDelete: () => void
  onMove: () => void
  onExport: () => void
  onCancel: () => void
  className?: string
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onMove,
  onExport,
  onCancel,
  className,
}: BulkActionsBarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-gradient-to-r from-violet-600 to-purple-600',
        'border-t border-white/20 shadow-2xl',
        'transform transition-transform duration-300',
        selectedCount > 0 ? 'translate-y-0' : 'translate-y-full',
        className
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Selection Info */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="text-white hover:bg-white/20"
            >
              {allSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Select All ({totalCount})
                </>
              )}
            </Button>
            <div className="text-white font-medium">
              {selectedCount} {selectedCount === 1 ? 'transaction' : 'transactions'} selected
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMove}
              className="text-white hover:bg-white/20"
            >
              <FolderInput className="w-4 h-4 mr-2" />
              Move to Portfolio
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
            <div className="w-px h-6 bg-white/20" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-white hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
