import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor?: string
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-violet-400',
}: StatCardProps) {
  return (
    <Card className="glass-strong border-white/10 hover:border-white/20 transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="uppercase-label">{title}</p>
            <p className="stat-value">{value}</p>
            {change && (
              <p
                className={cn(
                  'text-sm font-semibold font-mono tabular-nums',
                  changeType === 'positive' && 'text-profit',
                  changeType === 'negative' && 'text-loss',
                  changeType === 'neutral' && 'text-muted-foreground'
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div className={cn('w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center', iconColor)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
