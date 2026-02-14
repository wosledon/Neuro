import React from 'react'
import clsx from 'clsx'

export type AvatarProps = {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallback?: React.ReactNode
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
}

export default function Avatar({ 
  src, 
  alt, 
  name,
  size = 'md',
  className,
  fallback
}: AvatarProps) {
  const [error, setError] = React.useState(false)

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  const getRandomColor = (name?: string) => {
    if (!name) return 'bg-surface-400'
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500',
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  if (src && !error) {
    return (
      <img 
        src={src} 
        alt={alt || name} 
        className={clsx(
          'rounded-full object-cover border-2 border-white dark:border-surface-800 shadow-sm',
          sizeClasses[size],
          className
        )}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div 
      className={clsx(
        'rounded-full flex items-center justify-center text-white font-medium border-2 border-white dark:border-surface-800 shadow-sm',
        getRandomColor(name),
        sizeClasses[size],
        className
      )}
      title={name || alt}
    >
      {fallback || getInitials(name || alt)}
    </div>
  )
}

// Avatar Group Component
export function AvatarGroup({ 
  children, 
  max = 4,
  className 
}: { 
  children: React.ReactNode
  max?: number
  className?: string 
}) {
  const childrenArray = React.Children.toArray(children)
  const visibleChildren = childrenArray.slice(0, max)
  const remainingCount = childrenArray.length - max

  return (
    <div className={clsx('flex -space-x-2', className)}>
      {visibleChildren}
      {remainingCount > 0 && (
        <div className={clsx(
          'w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-sm font-medium text-surface-600 dark:text-surface-400 border-2 border-white dark:border-surface-800',
        )}>
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
