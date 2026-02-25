import React from 'react'
import clsx from 'clsx'
import { Button } from './Button'

export type EmptyStateProps = {
  title?: string
  description?: React.ReactNode
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  title = '暂无数据',
  description = '当前列表为空，请添加数据',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="w-20 h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
        {icon || (
          <svg 
            className="w-10 h-10 text-surface-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
        {title}
      </h3>
      {typeof description === 'string' ? (
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6">
          {description}
        </p>
      ) : (
        <div className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6">
          {description}
        </div>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}
