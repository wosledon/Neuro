import React, { useState, useRef, useEffect, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/solid'

export type SelectProps = {
  value?: string
  onChange?: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
  label?: string
  error?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ 
    value, 
    onChange, 
    options, 
    placeholder = '请选择',
    label,
    error,
    helperText,
    disabled = false,
    required = false,
    className,
    size = 'md'
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 })

    const selectedOption = options.find(opt => opt.value === value)

    // Size classes - adjusted to match Input component heights
    // Using fixed height to ensure consistent height across all pages
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm h-[36px]',
      md: 'px-4 py-3 text-sm h-[44px]',
      lg: 'px-4 py-3.5 text-base h-[52px]'
    }

    // Update dropdown position
    const updatePosition = () => {
      if (!triggerRef.current || !isOpen) return
      
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY || window.pageYOffset
      const scrollX = window.scrollX || window.pageXOffset
      
      setDropdownCoords({
        top: rect.bottom + scrollY + 4,
        left: rect.left + scrollX,
        width: rect.width
      })
    }

    useEffect(() => {
      if (isOpen && triggerRef.current) {
        updatePosition()
      }
    }, [isOpen])

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          dropdownRef.current && 
          !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current && 
          !triggerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('resize', () => setIsOpen(false))
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('resize', () => setIsOpen(false))
      }
    }, [isOpen])

    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault()
            setHighlightedIndex(prev => 
              prev < options.length - 1 ? prev + 1 : prev
            )
            break
          case 'ArrowUp':
            e.preventDefault()
            setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
            break
          case 'Enter':
            e.preventDefault()
            if (highlightedIndex >= 0 && !options[highlightedIndex].disabled) {
              handleSelect(options[highlightedIndex].value)
            }
            break
          case 'Escape':
            setIsOpen(false)
            break
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, highlightedIndex, options])

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue)
      setIsOpen(false)
    }

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
        if (!isOpen) {
          const selectedIndex = options.findIndex(opt => opt.value === value)
          setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
        }
      }
    }

    // Dropdown content
    const dropdownContent = (
      <div
        ref={dropdownRef}
        style={{
          position: 'absolute',
          top: dropdownCoords.top,
          left: dropdownCoords.left,
          width: dropdownCoords.width,
          zIndex: 9999
        }}
        className={`
          bg-white dark:bg-surface-800 
          rounded-xl shadow-2xl 
          border border-surface-200 dark:border-surface-700
          overflow-hidden
          animate-fade-in-up
        `}
      >
        <div className="max-h-60 overflow-y-auto py-1">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => !option.disabled && handleSelect(option.value)}
              disabled={option.disabled}
              className={`
                w-full px-4 py-2.5 text-left text-sm
                flex items-center justify-between
                transition-colors duration-150
                ${option.disabled 
                  ? 'opacity-50 cursor-not-allowed text-surface-400' 
                  : 'hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'
                }
                ${value === option.value 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                  : 'text-surface-700 dark:text-surface-300'
                }
                ${highlightedIndex === index && !option.disabled
                  ? 'bg-surface-100 dark:bg-surface-700'
                  : ''
                }
              `}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && (
                <CheckIcon className="w-4 h-4 text-primary-600 flex-shrink-0 ml-2" />
              )}
            </button>
          ))}
        </div>
      </div>
    )

    return (
      <div ref={ref} className={clsx('w-full relative', className)}>
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            w-full box-border ${sizeClasses[size]}
            rounded-xl border 
            bg-white dark:bg-surface-900 
            text-left
            flex items-center justify-between
            transition-all duration-200
            ${disabled 
              ? 'opacity-50 cursor-not-allowed border-surface-200 dark:border-surface-700' 
              : 'cursor-pointer hover:border-surface-400 dark:hover:border-surface-500'
            }
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-surface-300 dark:border-surface-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
            }
            ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : ''}
          `}
        >
          <span className={clsx(
            'truncate',
            selectedOption ? 'text-surface-900 dark:text-surface-100' : 'text-surface-400'
          )}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDownIcon 
            className={clsx(
              'w-5 h-5 text-surface-400 flex-shrink-0 ml-2 transition-transform duration-200',
              isOpen && 'rotate-180'
            )} 
          />
        </button>

        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{helperText}</p>
        )}

        {isOpen && createPortal(dropdownContent, document.body)}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
