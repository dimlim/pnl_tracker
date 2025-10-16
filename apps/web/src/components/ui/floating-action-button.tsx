'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface FloatingActionButtonProps {
  icon: LucideIcon
  onClick: () => void
  label?: string
  className?: string
  visible?: boolean
}

export function FloatingActionButton({
  icon: Icon,
  onClick,
  label = 'Quick Action',
  className,
  visible = true,
}: FloatingActionButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={cn(
            'fixed bottom-8 right-8 z-50',
            'w-16 h-16 rounded-full',
            'bg-gradient-to-br from-violet-500 to-fuchsia-500',
            'shadow-2xl shadow-violet-500/50',
            'flex items-center justify-center',
            'text-white',
            'transition-all duration-300',
            'hover:shadow-violet-500/70',
            'focus:outline-none focus:ring-4 focus:ring-violet-500/50',
            'md:w-16 md:h-16 md:bottom-8 md:right-8',
            'sm:w-14 sm:h-14 sm:bottom-6 sm:right-6',
            className
          )}
          aria-label={label}
        >
          <Icon className="w-8 h-8" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
