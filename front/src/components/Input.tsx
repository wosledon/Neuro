import React from 'react'
import clsx from 'clsx'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function Input(props: InputProps){
  return <input className={clsx('w-full px-4 py-3 rounded-md border border-gray-200 bg-white dark:bg-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 transition-shadow shadow-sm', props.className)} {...props} />
}
