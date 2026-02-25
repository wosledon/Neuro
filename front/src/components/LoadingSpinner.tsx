import React from 'react'
import clsx from 'clsx'

export type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  centered?: boolean
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

export default function LoadingSpinner({ 
  size = 'md', 
  className,
  centered = false,
  text
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={clsx(
      'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
      'text-primary-600 dark:text-primary-400',
      sizeClasses[size],
      className
    )} role="status">
      <span className="sr-only">加载中...</span>
    </div>
  )

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        {spinner}
        {text && (
          <span className="text-sm text-surface-500 dark:text-surface-400">{text}</span>
        )}
      </div>
    )
  }

  return spinner
}

// Full page loading overlay
export function FullPageLoader({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" />
        <span className="text-surface-600 dark:text-surface-400 font-medium">{text}</span>
      </div>
    </div>
  )
}
