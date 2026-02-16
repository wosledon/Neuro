import React, { useState, useRef, useEffect } from 'react'

export interface TooltipProps {
  children: React.ReactNode
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export default function Tooltip({ 
  children, 
  content, 
  placement = 'right',
  delay = 200 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMounted(true)
      // Small delay to allow mount before animation
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
    // Wait for animation to finish before unmounting
    setTimeout(() => {
      setIsMounted(false)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-surface-800 dark:border-t-surface-700 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-surface-800 dark:border-b-surface-700 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-surface-800 dark:border-l-surface-700 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-surface-800 dark:border-r-surface-700 border-t-transparent border-b-transparent border-l-transparent',
  }

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isMounted && (
        <div
          className={`
            absolute z-50 px-3 py-2 
            bg-surface-800 dark:bg-surface-700 
            text-white text-sm font-medium
            rounded-lg shadow-lg whitespace-nowrap
            pointer-events-none
            transition-all duration-150 ease-out
            ${placementClasses[placement]}
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
        >
          {content}
          {/* Arrow */}
          <span 
            className={`
              absolute w-0 h-0 
              border-4 border-solid
              ${arrowClasses[placement]}
            `} 
          />
        </div>
      )}
    </div>
  )
}
