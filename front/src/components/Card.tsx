import React from 'react'
import clsx from 'clsx'

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  compact?: boolean
}

export default function Card({ children, className, compact=false, ...rest }: CardProps){
  return (
    <div className={clsx('card', compact ? 'p-3' : 'p-6', className)} {...rest}>
      {children}
    </div>
  )
}
