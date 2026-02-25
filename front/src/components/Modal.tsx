import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { XMarkIcon } from '@heroicons/react/24/solid'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: ModalSize
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  className?: string
  contentClassName?: string
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
  contentClassName,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose()
      }
    },
    [closeOnEsc, onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={clsx(
          'relative w-full mx-4 bg-white dark:bg-surface-800 rounded-2xl shadow-soft-xl',
          'flex flex-col max-h-[90vh] animate-scale-in',
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-4 p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={clsx('flex-1 overflow-y-auto p-6', contentClassName)}>{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default Modal

// Confirm Modal Component
export type ConfirmModalProps = Omit<ModalProps, 'children' | 'footer'> & {
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  confirmVariant?: 'primary' | 'danger'
  isConfirmLoading?: boolean
}

export function ConfirmModal({
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  confirmVariant = 'primary',
  isConfirmLoading = false,
  ...modalProps
}: ConfirmModalProps) {
  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={modalProps.onClose}
        className="px-4 py-2 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      >
        {cancelText}
      </button>
      <button
        onClick={onConfirm}
        disabled={isConfirmLoading}
        className={clsx(
          'px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors',
          confirmVariant === 'primary' && 'bg-primary-600 hover:bg-primary-700',
          confirmVariant === 'danger' && 'bg-red-600 hover:bg-red-700',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isConfirmLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            处理中...
          </span>
        ) : (
          confirmText
        )}
      </button>
    </div>
  )

  return (
    <Modal {...modalProps} footer={footer}>
      <p className="text-surface-600 dark:text-surface-400">
        {modalProps.description}
      </p>
    </Modal>
  )
}
