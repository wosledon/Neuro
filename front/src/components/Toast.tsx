import React from 'react'
import clsx from 'clsx'

export type ToastProps = { id?: string, type?: 'info'|'success'|'error', message: string }

export default function Toast({ type='info', message }: ToastProps){
  const colors = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-indigo-600'
  return (
    <div className={clsx('text-white px-4 py-2 rounded-md shadow-md flex items-center gap-3', colors)}>
      <div className="flex-1 text-sm">{message}</div>
    </div>
  )
}
