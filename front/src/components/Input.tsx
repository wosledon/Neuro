import React from 'react'
import clsx from 'clsx'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function Input(props: InputProps){
  return <input className={clsx('w-full px-3 py-2 rounded border bg-white dark:bg-gray-900', props.className)} {...props} />
}
