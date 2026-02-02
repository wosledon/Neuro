import React from 'react'
import { Button } from '../components'
import Badge from '../components/Badge'

export default function ComponentsPage(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Component Playground</h2>

      <section className="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <h3 className="font-medium">Buttons</h3>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
        <pre className="mt-3 p-2 bg-gray-50 dark:bg-gray-900 text-xs rounded">{`<Button variant="primary">Primary</Button>`}</pre>
      </section>

      <section className="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <h3 className="font-medium">Badges</h3>
        <div className="mt-3 flex items-center gap-2">
          <Badge>Default</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="danger">Danger</Badge>
        </div>
        <pre className="mt-3 p-2 bg-gray-50 dark:bg-gray-900 text-xs rounded">{`<Badge tone="success">Success</Badge>`}</pre>
      </section>

    </div>
  )
}
