'use client'

import { useState } from 'react'
import { Settings, ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface WidgetConfig {
  id: string
  title: string
  description?: string
  enabled: boolean
  order: number
}

interface WidgetSettingsProps {
  widgets: WidgetConfig[]
  onUpdate: (widgets: WidgetConfig[]) => void
  onReset: () => void
}

export function WidgetSettings({ widgets, onUpdate, onReset }: WidgetSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (id: string) => {
    const updated = widgets.map(w =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    )
    onUpdate(updated)
  }

  const handleMoveUp = (id: string) => {
    const index = widgets.findIndex(w => w.id === id)
    if (index <= 0) return

    const updated = [...widgets]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp

    // Update order numbers
    updated.forEach((w, i) => {
      w.order = i
    })

    onUpdate(updated)
  }

  const handleMoveDown = (id: string) => {
    const index = widgets.findIndex(w => w.id === id)
    if (index >= widgets.length - 1) return

    const updated = [...widgets]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp

    // Update order numbers
    updated.forEach((w, i) => {
      w.order = i
    })

    onUpdate(updated)
  }

  const enabledCount = widgets.filter(w => w.enabled).length

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Customize Dashboard
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Dashboard Settings</SheetTitle>
          <SheetDescription>
            Customize which widgets to show and their order
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {enabledCount} of {widgets.length} widgets enabled
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Reset
            </Button>
          </div>

          <Separator />

          {/* Widget List */}
          <div className="space-y-3">
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  widget.enabled
                    ? "bg-violet-500/5 border-violet-500/20"
                    : "bg-muted/50 border-border opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Toggle Switch */}
                  <div className="flex items-center pt-1">
                    <Switch
                      id={`widget-${widget.id}`}
                      checked={widget.enabled}
                      onCheckedChange={() => handleToggle(widget.id)}
                    />
                  </div>

                  {/* Widget Info */}
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={`widget-${widget.id}`}
                      className={cn(
                        "font-semibold cursor-pointer",
                        !widget.enabled && "text-muted-foreground"
                      )}
                    >
                      {widget.title}
                    </Label>
                    {widget.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {widget.description}
                      </p>
                    )}
                  </div>

                  {/* Move Buttons */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveUp(widget.id)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveDown(widget.id)}
                      disabled={index === widgets.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help Text */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Quick Tips</p>
                <ul className="space-y-1 text-xs">
                  <li>• Toggle switches to show/hide widgets</li>
                  <li>• Use arrows to reorder widgets</li>
                  <li>• Changes save automatically</li>
                  <li>• Click Reset to restore defaults</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
