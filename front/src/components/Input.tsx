import React, { forwardRef } from 'react'
import clsx from 'clsx'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, ...props }, ref) => {
    const inputClasses = clsx(
      'w-full rounded-xl border bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100',
      'placeholder-surface-400 dark:placeholder-surface-500',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      leftIcon ? 'pl-11' : 'px-4',
      rightIcon ? 'pr-11' : 'px-4',
      error 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
        : 'border-surface-300 dark:border-surface-600 focus:border-primary-500',
      'py-3',
      className
    )

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500">
              {leftIcon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

// TextArea Component
export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  helperText?: string
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, resize = 'vertical', className, ...props }, ref) => {
    const textareaClasses = clsx(
      'w-full px-4 py-3 rounded-xl border bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100',
      'placeholder-surface-400 dark:placeholder-surface-500',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      resize === 'none' && 'resize-none',
      resize === 'vertical' && 'resize-y',
      resize === 'horizontal' && 'resize-x',
      resize === 'both' && 'resize',
      error 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
        : 'border-surface-300 dark:border-surface-600',
      className
    )

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea ref={ref} className={textareaClasses} {...props} />
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{helperText}</p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

// Select Component
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  helperText?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, ...props }, ref) => {
    const selectClasses = clsx(
      'w-full px-4 py-3 rounded-xl border bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed appearance-none',
      'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E")] bg-[right_0.75rem_center] bg-[length:1.25rem] bg-no-repeat pr-10',
      error 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
        : 'border-surface-300 dark:border-surface-600',
      className
    )

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select ref={ref} className={selectClasses} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
