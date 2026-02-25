import React from 'react'
import clsx from 'clsx'

export type SkeletonProps = {
  className?: string
  width?: string | number
  height?: string | number
  circle?: boolean
  count?: number
}

export default function Skeleton({ 
  className, 
  width, 
  height, 
  circle = false,
  count = 1 
}: SkeletonProps) {
  const baseClasses = 'bg-surface-200 dark:bg-surface-700 animate-pulse'
  
  const style: React.CSSProperties = {
    width: width,
    height: height,
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            baseClasses,
            circle ? 'rounded-full' : 'rounded-lg',
            className
          )}
          style={style}
        />
      ))}
    </>
  )
}

// Skeleton Card Component
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('card p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton circle width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <Skeleton count={2} height={16} />
    </div>
  )
}

// Skeleton Table Component
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1" height={40} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="flex-1" height={48} />
          ))}
        </div>
      ))}
    </div>
  )
}
