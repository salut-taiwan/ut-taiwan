'use client'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AnimateInProps {
  children: ReactNode
  delay?: number
  className?: string
  direction?: 'up' | 'left' | 'right'
}

export function AnimateIn({ children, delay = 0, className, direction = 'up' }: AnimateInProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: direction === 'up' ? 20 : 0,
        x: direction === 'left' ? -30 : direction === 'right' ? 30 : 0,
      }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
