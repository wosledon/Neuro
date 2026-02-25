import React, { createContext, useContext, useState, useCallback } from 'react'
import { ToastContainer, ToastType } from './Toast'

interface ToastContextType {
  show: (message: string, type?: ToastType) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const showSuccess = useCallback((message: string) => {
    show(message, 'success')
  }, [show])

  const showError = useCallback((message: string) => {
    show(message, 'error')
  }, [show])

  const showInfo = useCallback((message: string) => {
    show(message, 'info')
  }, [show])

  const showWarning = useCallback((message: string) => {
    show(message, 'warning')
  }, [show])

  const value = {
    show,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}
