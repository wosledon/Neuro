import React from 'react'
import clsx from 'clsx'

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  compact?: boolean
  hover?: boolean
  interactive?: boolean
  noPadding?: boolean
}

export default function Card({ 
  children, 
  className, 
  compact = false,
  hover = false,
  interactive = false,
  noPadding = false,
  ...rest 
}: CardProps) {
  const baseClasses = 'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-soft transition-all duration-300 ease-smooth'
  
  const paddingClasses = noPadding ? '' : compact ? 'p-4' : 'p-6'
  
  const hoverClasses = hover ? 'hover:shadow-soft-lg hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-800' : ''
  
  const interactiveClasses = interactive 
    ? 'cursor-pointer hover:shadow-soft-xl hover:-translate-y-1.5 active:translate-y-0 active:shadow-soft' 
    : ''

  return (
    <div 
      className={clsx(baseClasses, paddingClasses, hoverClasses, interactiveClasses, className)} 
      {...rest}
    >
      {children}
    </div>
  )
}

// Card Header Component
export function CardHeader({ 
  children, 
  className,
  title,
  subtitle,
  action,
}: { 
  children?: React.ReactNode
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className={clsx('flex items-start justify-between mb-4', className)}>
      <div className="flex-1 min-w-0">
        {title && <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{title}</h3>}
        {subtitle && <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  )
}

// Card Footer Component
export function CardFooter({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-surface-200 dark:border-surface-700', className)}>
      {children}
    </div>
  )
}

// Stat Card Component
export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  className,
}: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  className?: string
}) {
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-surface-500 dark:text-surface-400',
  }

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-surface-900 dark:text-white">{value}</p>
          {change && (
            <p className={clsx('mt-1 text-sm font-medium', changeColors[changeType])}>
              {changeType === 'positive' && '↑ '}
              {changeType === 'negative' && '↓ '}
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
