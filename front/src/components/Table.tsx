import React from 'react'
import clsx from 'clsx'

export type TableColumn<T> = {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (record: T, index: number) => React.ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
  sorter?: boolean
  onSort?: () => void
}

export type TableProps<T> = {
  columns: TableColumn<T>[]
  dataSource: T[]
  rowKey: keyof T | ((record: T) => string)
  loading?: boolean
  emptyText?: React.ReactNode
  onRowClick?: (record: T) => void
  className?: string
  noBorder?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number) => void
  }
}

export function Table<T extends Record<string, any>>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  emptyText = '暂无数据',
  onRowClick,
  className,
  noBorder = false,
  pagination,
}: TableProps<T>) {
  const getRowKey = (record: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return String(record[rowKey])
  }

  const getCellValue = (record: T, column: TableColumn<T>, index: number): React.ReactNode => {
    if (column.render) {
      return column.render(record, index)
    }
    if (column.dataIndex) {
      return record[column.dataIndex]
    }
    return null
  }

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <div className={clsx(
      'overflow-hidden rounded-2xl',
      !noBorder && 'border border-surface-200 dark:border-surface-700 shadow-soft',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-6 py-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider',
                    alignClasses[column.align || 'left'],
                    column.sorter && 'cursor-pointer hover:text-surface-700 dark:hover:text-surface-200'
                  )}
                  style={{ width: column.width }}
                  onClick={column.sorter ? column.onSort : undefined}
                >
                  <div className={clsx('flex items-center gap-1', column.align === 'center' && 'justify-center', column.align === 'right' && 'justify-end')}>
                    {column.title}
                    {column.sorter && (
                      <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="text-sm text-surface-500">加载中...</span>
                  </div>
                </td>
              </tr>
            ) : dataSource.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center gap-3 text-surface-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm">{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              dataSource.map((record, index) => (
                <tr
                  key={getRowKey(record)}
                  onClick={() => onRowClick?.(record)}
                  className={clsx(
                    'bg-white dark:bg-surface-800 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={`${getRowKey(record)}-${column.key}`}
                      className={clsx(
                        'px-6 py-4 text-sm',
                        alignClasses[column.align || 'left']
                      )}
                    >
                      {getCellValue(record, column, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <div className="text-sm text-surface-500 dark:text-surface-400">
            共 {pagination.total} 条记录
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onChange(pagination.current - 1)}
              disabled={pagination.current <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-400 
                         hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <span className="text-sm text-surface-600 dark:text-surface-400">
              {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => pagination.onChange(pagination.current + 1)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-400 
                         hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table
