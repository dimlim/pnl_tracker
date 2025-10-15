'use client'

import { useState, useEffect, ReactNode } from 'react'
import { WidgetSettings, WidgetConfig } from './widget-settings'

interface DashboardWidget {
  id: string
  title: string
  description?: string
  component: ReactNode
  defaultOrder: number
  defaultEnabled?: boolean
}

interface ManagedDashboardProps {
  widgets: DashboardWidget[]
  storageKey?: string
}

export function ManagedDashboard({ widgets, storageKey = 'dashboard-config' }: ManagedDashboardProps) {
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([])

  // Initialize widget configs from localStorage or defaults
  useEffect(() => {
    const savedConfig = localStorage.getItem(storageKey)
    
    if (savedConfig) {
      try {
        const saved = JSON.parse(savedConfig) as WidgetConfig[]
        // Merge with current widgets (in case new widgets were added)
        const merged = widgets.map(w => {
          const savedWidget = saved.find(s => s.id === w.id)
          return savedWidget || {
            id: w.id,
            title: w.title,
            description: w.description,
            enabled: w.defaultEnabled ?? true,
            order: w.defaultOrder,
          }
        })
        // Sort by order
        merged.sort((a, b) => a.order - b.order)
        setWidgetConfigs(merged)
      } catch {
        initializeDefaults()
      }
    } else {
      initializeDefaults()
    }
  }, [widgets, storageKey])

  const initializeDefaults = () => {
    const configs = widgets
      .map(w => ({
        id: w.id,
        title: w.title,
        description: w.description,
        enabled: w.defaultEnabled ?? true,
        order: w.defaultOrder,
      }))
      .sort((a, b) => a.order - b.order)
    setWidgetConfigs(configs)
  }

  const handleUpdate = (updated: WidgetConfig[]) => {
    setWidgetConfigs(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const handleReset = () => {
    initializeDefaults()
    localStorage.removeItem(storageKey)
  }

  // Get ordered and enabled widgets
  const displayWidgets = widgetConfigs
    .filter(config => config.enabled)
    .map(config => widgets.find(w => w.id === config.id))
    .filter((w): w is DashboardWidget => w !== undefined)

  return (
    <div className="space-y-6">
      {/* Settings Button */}
      <div className="flex justify-end">
        <WidgetSettings
          widgets={widgetConfigs}
          onUpdate={handleUpdate}
          onReset={handleReset}
        />
      </div>

      {/* Widgets */}
      <div className="space-y-8">
        {displayWidgets.length > 0 ? (
          displayWidgets.map((widget) => (
            <div key={widget.id}>
              {widget.component}
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              No widgets enabled. Open settings to enable widgets.
            </p>
            <WidgetSettings
              widgets={widgetConfigs}
              onUpdate={handleUpdate}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  )
}
