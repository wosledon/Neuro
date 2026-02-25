import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/solid'

export type ToastType = 'info' | 'success' | 'error' | 'warning'

export type ToastProps = { 
  id?: string
  type?: ToastType
  message: string 
  duration?: number
  onClose?: () => void
}

const typeConfig: Record<ToastType, { icon: React.ElementType; colors: string }> = {
  info: { 
    icon: InformationCircleIcon, 
    colors: 'bg-blue-600 text-white' 
  },
  success: { 
    icon: CheckCircleIcon, 
    colors: 'bg-green-600 text-white' 
  },
  error: { 
    icon: ExclamationCircleIcon, 
    colors: 'bg-red-600 text-white' 
  },
  warning: { 
    icon: ExclamationCircleIcon, 
    colors: 'bg-amber-500 text-white' 
  },
}

export default function Toast({ 
  type = 'info', 
  message, 
  duration = 3000,
  onClose 
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)
  const { icon: Icon, colors } = typeConfig[type]

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(progressInterval)
          return 0
        }
        return prev - (100 / (duration / 100))
      })
    }, 100)

    const exitTimeout = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        onClose?.()
      }, 300)
    }, duration)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(exitTimeout)
    }
  }, [duration, onClose])

  return (
    <div 
      className={clsx(
        'relative flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[300px] max-w-md overflow-hidden',
        colors,
        'animate-slide-in-right',
        isExiting && 'animate-fade-out translate-x-full'
      )}
    >
      {/* Progress bar */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-white/30 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
      
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button 
        onClick={() => {
          setIsExiting(true)
          setTimeout(() => onClose?.(), 300)
        }}
        className="p-0.5 rounded hover:bg-white/20 transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

// Toast Container
export type ToastItem = {
  id: string
  type: ToastType
  message: string
}

export type ToastContainerProps = {
  toasts: ToastItem[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}
