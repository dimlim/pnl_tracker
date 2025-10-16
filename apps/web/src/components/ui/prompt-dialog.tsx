'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface PromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  defaultValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  onConfirm: (value: string) => void
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultValue = '',
  placeholder,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="prompt-input">Name</Label>
          <Input
            id="prompt-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirm()
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button onClick={handleConfirm} disabled={!value.trim()}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook для використання
export function usePromptDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean
    title: string
    description?: string
    defaultValue?: string
    placeholder?: string
    confirmText?: string
    cancelText?: string
    onConfirm: (value: string) => void
  }>({
    open: false,
    title: '',
    onConfirm: () => {},
  })

  const prompt = (options: {
    title: string
    description?: string
    defaultValue?: string
    placeholder?: string
    confirmText?: string
    cancelText?: string
  }): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        ...options,
        onConfirm: (value) => {
          setDialogState((prev) => ({ ...prev, open: false }))
          resolve(value)
        },
      })
    })
  }

  const dialog = (
    <PromptDialog
      {...dialogState}
      onOpenChange={(open) => {
        if (!open) {
          setDialogState((prev) => ({ ...prev, open: false }))
          // resolve(null) when cancelled
        }
      }}
    />
  )

  return { prompt, dialog }
}
