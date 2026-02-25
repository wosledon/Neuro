import React from 'react'
import Button from './Button'

export default { title: 'Components/Button', component: Button }

export const Primary = () => <Button variant="primary">Primary</Button>
export const Secondary = () => <Button variant="secondary">Secondary</Button>
export const Ghost = () => <Button variant="ghost">Ghost</Button>

export const Sizes = () => (
  <div className="flex gap-2">
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
)
