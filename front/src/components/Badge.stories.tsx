import React from 'react'
import Badge from './Badge'

export default { title: 'Components/Badge', component: Badge }

export const Default = () => <Badge>Default</Badge>
export const Success = () => <Badge tone="success">Success</Badge>
export const Danger = () => <Badge tone="danger">Danger</Badge>
