import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface TooltipProps {
  children: React.ReactNode
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  maxWidth?: number
}

export default function Tooltip({ 
  children, 
  content, 
  placement = 'top',
  delay = 200,
  maxWidth = 250
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [adjustedPlacement, setAdjustedPlacement] = useState(placement)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMounted(true)
      updatePosition()
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
    setTimeout(() => {
      setIsMounted(false)
    }, 200)
  }

  const updatePosition = () => {
    if (!triggerRef.current) return
    
    const rect = triggerRef.current.getBoundingClientRect()
    const scrollX = window.scrollX || window.pageXOffset
    const scrollY = window.scrollY || window.pageYOffset
    
    // Viewport boundaries
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let x = 0
    let y = 0
    let finalPlacement = placement
    
    // Calculate tooltip dimensions (estimate)
    const tooltipWidth = Math.min(content.length * 14 + 24, maxWidth)
    const tooltipHeight = 40 // approximate
    
    switch (placement) {
      case 'top':
        x = rect.left + rect.width / 2 + scrollX
        y = rect.top + scrollY - 8
        // Check if too close to top edge
        if (rect.top < tooltipHeight + 16) {
          finalPlacement = 'bottom'
          y = rect.bottom + scrollY + 8
        }
        break
      case 'bottom':
        x = rect.left + rect.width / 2 + scrollX
        y = rect.bottom + scrollY + 8
        // Check if too close to bottom edge
        if (viewportHeight - rect.bottom < tooltipHeight + 16) {
          finalPlacement = 'top'
          y = rect.top + scrollY - 8
        }
        break
      case 'left':
        x = rect.left + scrollX - 8
        y = rect.top + rect.height / 2 + scrollY
        // Check if too close to left edge
        if (rect.left < tooltipWidth + 16) {
          finalPlacement = 'right'
          x = rect.right + scrollX + 8
        }
        break
      case 'right':
        x = rect.right + scrollX + 8
        y = rect.top + rect.height / 2 + scrollY
        // Check if too close to right edge
        if (viewportWidth - rect.right < tooltipWidth + 16) {
          finalPlacement = 'left'
          x = rect.left + scrollX - 8
        }
        break
    }
    
    setAdjustedPlacement(finalPlacement)
    setCoords({ x, y })
  }

  useEffect(() => {
    if (isMounted) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
    }
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isMounted])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getTooltipStyles = () => {
    const base = {
      position: 'fixed' as const,
      left: coords.x,
      top: coords.y,
      maxWidth: maxWidth,
    }
    
    switch (adjustedPlacement) {
      case 'top':
        return { ...base, transform: 'translate(-50%, -100%)' }
      case 'bottom':
        return { ...base, transform: 'translate(-50%, 0)' }
      case 'left':
        return { ...base, transform: 'translate(-100%, -50%)' }
      case 'right':
        return { ...base, transform: 'translate(0, -50%)' }
    }
  }

  const getArrowStyles = () => {
    const base = 'absolute w-2 h-2 bg-surface-800 dark:bg-surface-700 rotate-45'
    
    switch (adjustedPlacement) {
      case 'top':
        return `${base} left-1/2 -translate-x-1/2 -bottom-1`
      case 'bottom':
        return `${base} left-1/2 -translate-x-1/2 -top-1`
      case 'left':
        return `${base} top-1/2 -translate-y-1/2 -right-1`
      case 'right':
        return `${base} top-1/2 -translate-y-1/2 -left-1`
    }
  }

  const tooltipContent = (
    <div
      ref={tooltipRef}
      style={getTooltipStyles()}
      className={`
        z-[99999] px-3 py-2 
        bg-surface-800 dark:bg-surface-700 
        text-white text-sm font-medium
        rounded-lg shadow-2xl
        pointer-events-none
        transition-all duration-200 ease-out
        break-words text-center leading-relaxed
        ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95'}
        ${adjustedPlacement === 'top' && !isVisible ? 'translate-y-1' : ''}
        ${adjustedPlacement === 'bottom' && !isVisible ? '-translate-y-1' : ''}
        ${adjustedPlacement === 'left' && !isVisible ? 'translate-x-1' : ''}
        ${adjustedPlacement === 'right' && !isVisible ? '-translate-x-1' : ''}
      `}
    >
      {content}
      <span className={getArrowStyles()} />
    </div>
  )

  return (
    <span 
      ref={triggerRef}
      className="contents"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isMounted && createPortal(tooltipContent, document.body)}
    </span>
  )
}
