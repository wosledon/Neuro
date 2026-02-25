import React from 'react'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid'
import { Route } from '../router'

export interface BreadcrumbItem {
  label: string
  route?: Route
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  onNavigate?: (route: Route) => void
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
      <button
        onClick={() => onNavigate?.('home')}
        className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <HomeIcon className="w-4 h-4" />
        <span>首页</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <React.Fragment key={index}>
            <ChevronRightIcon className="w-4 h-4 text-surface-400 dark:text-surface-600" />
            {isLast || !item.route ? (
              <span
                className={`${
                  isLast
                    ? 'text-surface-900 dark:text-white font-medium'
                    : 'text-surface-500 dark:text-surface-400'
                }`}
              >
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => item.route && onNavigate?.(item.route)}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
