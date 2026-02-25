import React from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
export type BadgeSize = 'sm' | 'md' | 'lg'

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  pulse?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-200',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm',
}

export function Badge({ 
  variant = 'default', 
  size = 'md',
  dot = false,
  pulse = false,
  className, 
  children,
  ...rest 
}: BadgeProps) {
  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-surface-500',
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <span 
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )} 
      {...rest}
    >
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          dotColors[variant],
          pulse && 'animate-pulse'
        )} />
      )}
      {children}
    </span>
  )
}

export default Badge

// Status Badge with icon
export type StatusBadgeProps = {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success'
  text?: string
  className?: string
}

export function StatusBadge({ status, text, className }: StatusBadgeProps) {
  const config = {
    active: { variant: 'success' as const, text: text || '活跃', icon: '●' },
    inactive: { variant: 'default' as const, text: text || '未激活', icon: '○' },
    pending: { variant: 'warning' as const, text: text || '待处理', icon: '◐' },
    error: { variant: 'danger' as const, text: text || '错误', icon: '✕' },
    success: { variant: 'success' as const, text: text || '成功', icon: '✓' },
  }

  const { variant, text: defaultText, icon } = config[status]

  return (
    <Badge variant={variant} className={className}>
      <span className="text-xs">{icon}</span>
      {defaultText}
    </Badge>
  )
}
