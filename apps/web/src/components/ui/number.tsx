import { cn } from '@/lib/utils'

interface NumberProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'stat' | 'price' | 'hero'
}

export function Number({ children, className, variant = 'default' }: NumberProps) {
  const variantClasses = {
    default: 'font-mono tabular-nums',
    stat: 'stat-value',
    price: 'price-value',
    hero: 'hero-value',
  }

  return (
    <span className={cn(variantClasses[variant], className)}>
      {children}
    </span>
  )
}
