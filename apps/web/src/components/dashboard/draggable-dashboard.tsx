'use client'

import { useState, useEffect, ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardWidget {
  id: string
  title: string
  component: ReactNode
  defaultOrder: number
}

interface DraggableDashboardProps {
  widgets: DashboardWidget[]
  storageKey?: string
}

function SortableWidget({ id, children }: { id: string; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-50"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -top-3 left-1/2 -translate-x-1/2 z-10",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "cursor-grab active:cursor-grabbing"
        )}
      >
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-500 shadow-lg">
          <GripVertical className="w-4 h-4 text-white" />
          <span className="text-xs font-semibold text-white">Drag</span>
        </div>
      </div>
      
      {children}
    </div>
  )
}

export function DraggableDashboard({ widgets, storageKey = 'dashboard-layout' }: DraggableDashboardProps) {
  const [items, setItems] = useState<DashboardWidget[]>([])
  const [isEditMode, setIsEditMode] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load saved layout from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(storageKey)
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder) as string[]
        const orderedWidgets = orderIds
          .map(id => widgets.find(w => w.id === id))
          .filter((w): w is DashboardWidget => w !== undefined)
        
        // Add any new widgets that weren't in saved order
        const newWidgets = widgets.filter(w => !orderIds.includes(w.id))
        setItems([...orderedWidgets, ...newWidgets])
      } catch {
        setItems(widgets)
      }
    } else {
      setItems(widgets)
    }
  }, [widgets, storageKey])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(newItems.map(item => item.id)))
        
        return newItems
      })
    }
  }

  const resetLayout = () => {
    const defaultOrder = [...widgets].sort((a, b) => a.defaultOrder - b.defaultOrder)
    setItems(defaultOrder)
    localStorage.removeItem(storageKey)
  }

  return (
    <div className="space-y-6">
      {/* Edit Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              isEditMode && "bg-violet-500 hover:bg-violet-600"
            )}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            {isEditMode ? 'Done Editing' : 'Customize Layout'}
          </Button>
          
          {isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetLayout}
            >
              Reset to Default
            </Button>
          )}
        </div>
        
        {isEditMode && (
          <p className="text-sm text-muted-foreground">
            Drag widgets to rearrange them
          </p>
        )}
      </div>

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className={cn(
            "space-y-8",
            isEditMode && "space-y-12" // Extra space for drag handles
          )}>
            {items.map((widget) => (
              <SortableWidget key={widget.id} id={widget.id}>
                <div className={cn(
                  "transition-all duration-200",
                  isEditMode && "ring-2 ring-violet-500/50 ring-offset-4 ring-offset-background rounded-xl"
                )}>
                  {widget.component}
                </div>
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
