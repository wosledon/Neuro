import React from 'react'
import clsx from 'clsx'

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'default' | 'success' | 'danger'
}

export default function Badge({ tone = 'default', className, children, ...rest }: BadgeProps){
  const map: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 border border-gray-100',
    success: 'bg-green-50 text-green-800 dark:bg-green-900/20 border border-green-100',
    danger: 'bg-red-50 text-red-800 dark:bg-red-900/20 border border-red-100'
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', map[tone], className)} {...rest}>
      {children}
    </span>
  )
}
