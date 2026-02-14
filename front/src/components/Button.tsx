import React from 'react'
import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-glow active:bg-primary-800',
  secondary: 'bg-surface-100 text-surface-900 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700',
  ghost: 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
  danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 active:bg-red-800',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  leftIcon,
  rightIcon,
  className, 
  children, 
  disabled,
  ...rest 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ease-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <button 
      className={clsx(baseClasses, variantStyles[variant], sizeStyles[size], className)} 
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}

export default Button
