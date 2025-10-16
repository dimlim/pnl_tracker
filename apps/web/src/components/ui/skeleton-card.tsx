'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  className?: string
  showHeader?: boolean
  lines?: number
}

export function SkeletonCard({ className, showHeader = true, lines = 3 }: SkeletonCardProps) {
  return (
    <Card className={cn('glass-strong border-white/10', className)}>
      {showHeader && (
        <CardHeader>
          <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-white/10 rounded animate-pulse',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <Card className="glass-strong border-white/10">
      <CardHeader>
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-[350px] bg-white/5 rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="glass-strong border-white/10">
      <CardHeader>
        <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
