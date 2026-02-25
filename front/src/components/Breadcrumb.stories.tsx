import type { Meta, StoryObj } from '@storybook/react'
import Breadcrumb from './Breadcrumb'
import { Route } from '../router'

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: [
      { label: '系统管理', route: 'dashboard' },
      { label: '用户管理' },
    ],
    onNavigate: (route: Route) => console.log('Navigate to:', route),
  },
}

export const SingleItem: Story = {
  args: {
    items: [{ label: '首页' }],
    onNavigate: (route: Route) => console.log('Navigate to:', route),
  },
}

export const MultipleLevels: Story = {
  args: {
    items: [
      { label: '知识库', route: 'documents' },
      { label: '文档管理', route: 'documents' },
      { label: '项目文档' },
    ],
    onNavigate: (route: Route) => console.log('Navigate to:', route),
  },
}

export const NoNavigation: Story = {
  args: {
    items: [
      { label: '权限管理' },
      { label: '角色管理' },
    ],
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}
