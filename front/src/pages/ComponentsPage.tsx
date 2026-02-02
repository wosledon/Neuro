import React from 'react'
import { Button, Card, Input, Avatar } from '../components'
import Badge from '../components/Badge'

export default function ComponentsPage(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Component Playground</h2>

      <section className="card">
        <h3 className="font-medium">Buttons</h3>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      <section className="card">
        <h3 className="font-medium">Form controls</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">示例输入</label>
            <Input placeholder="输入文本..." />
          </div>
          <div>
            <label className="text-sm">带头像的按钮</label>
            <div className="mt-2 flex items-center gap-2">
              <Avatar src="/assets/logo.png" alt="logo" />
              <Button>使用头像</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 className="font-medium">Badges</h3>
        <div className="mt-3 flex items-center gap-2">
          <Badge>Default</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="danger">Danger</Badge>
        </div>
      </section>

    </div>
  )
}
