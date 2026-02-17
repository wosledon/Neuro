import React, { useState } from 'react'
import { 
  Button, 
  Card, 
  Input, 
  TextArea, 
  Select,
  Badge, 
  Avatar,
  Modal,
  Table,
  Skeleton,
  EmptyState,
  LoadingSpinner,
  StatCard
} from '../components'
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  PlusIcon
} from '@heroicons/react/24/solid'

export default function ComponentsPage() {
  const [showModal, setShowModal] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')

  const sampleData = [
    { id: '1', name: '张三', email: 'zhangsan@example.com', role: '管理员', status: 'active' },
    { id: '2', name: '李四', email: 'lisi@example.com', role: '用户', status: 'active' },
    { id: '3', name: '王五', email: 'wangwu@example.com', role: '编辑', status: 'inactive' },
  ]

  const columns = [
    { key: 'name', title: '姓名', dataIndex: 'name' as const },
    { key: 'email', title: '邮箱', dataIndex: 'email' as const },
    { key: 'role', title: '角色', dataIndex: 'role' as const },
    { 
      key: 'status', 
      title: '状态',
      render: (record: any) => (
        <Badge variant={record.status === 'active' ? 'success' : 'default'} size="sm">
          {record.status === 'active' ? '活跃' : '未激活'}
        </Badge>
      )
    },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
          组件库
        </h1>
        <p className="text-surface-500 dark:text-surface-400">
          展示 Neuro UI 组件库的所有组件
        </p>
      </div>

      <div className="space-y-8">
        {/* Buttons */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">按钮 Button</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">主要按钮</Button>
              <Button variant="secondary">次要按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
              <Button variant="danger">危险按钮</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">小按钮</Button>
              <Button size="md">中按钮</Button>
              <Button size="lg">大按钮</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button isLoading>加载中</Button>
              <Button disabled>禁用状态</Button>
              <Button leftIcon={<PlusIcon className="w-4 h-4" />}>带图标</Button>
            </div>
          </div>
        </Card>

        {/* Form Controls */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">表单控件 Form</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input 
                label="普通输入框"
                placeholder="请输入内容"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Input 
                label="带图标"
                placeholder="搜索..."
                leftIcon={<BellIcon className="w-5 h-5" />}
              />
              <Input 
                label="错误状态"
                placeholder="输入错误内容"
                error="请输入有效的邮箱地址"
              />
              <Input 
                label="禁用状态"
                placeholder="不可编辑"
                disabled
              />
            </div>
            <div className="space-y-4">
              <TextArea 
                label="文本域"
                placeholder="请输入多行文本..."
                rows={4}
              />
              <Select
                label="下拉选择"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                options={[
                  { value: '', label: '请选择' },
                  { value: '1', label: '选项一' },
                  { value: '2', label: '选项二' },
                  { value: '3', label: '选项三' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Badges */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">徽章 Badge</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>默认</Badge>
            <Badge variant="primary">主要</Badge>
            <Badge variant="success">成功</Badge>
            <Badge variant="warning">警告</Badge>
            <Badge variant="danger">危险</Badge>
            <Badge variant="info">信息</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Badge size="sm">小尺寸</Badge>
            <Badge size="md">中尺寸</Badge>
            <Badge size="lg">大尺寸</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Badge dot>带圆点</Badge>
            <Badge dot pulse>脉冲动画</Badge>
          </div>
        </Card>

        {/* Avatars */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">头像 Avatar</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar size="xs" name="张三" />
            <Avatar size="sm" name="李四" />
            <Avatar size="md" name="王五" />
            <Avatar size="lg" name="赵六" />
            <Avatar size="xl" name="钱七" />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Avatar src="https://i.pravatar.cc/150?img=1" name="User 1" />
            <Avatar src="https://i.pravatar.cc/150?img=2" name="User 2" />
            <Avatar src="https://i.pravatar.cc/150?img=3" name="User 3" />
            <Avatar src="/broken-url.jpg" name="Fallback" />
          </div>
        </Card>

        {/* Stat Cards */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">统计卡片 StatCard</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="总用户数" 
              value="12,345" 
              change="+12%" 
              changeType="positive"
              icon={<UserIcon className="w-6 h-6" />}
            />
            <StatCard 
              title="活跃用户" 
              value="8,234" 
              change="+5%" 
              changeType="positive"
              icon={<CheckCircleIcon className="w-6 h-6" />}
            />
            <StatCard 
              title="待处理" 
              value="23" 
              change="-3" 
              changeType="negative"
              icon={<ExclamationTriangleIcon className="w-6 h-6" />}
            />
            <StatCard 
              title="系统状态" 
              value="正常" 
              changeType="neutral"
              icon={<BellIcon className="w-6 h-6" />}
            />
          </div>
        </Card>

        {/* Table */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">表格 Table</h2>
          <Table 
            columns={columns}
            dataSource={sampleData}
            rowKey="id"
          />
        </Card>

        {/* Modal */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">弹窗 Modal</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowModal(true)}>打开弹窗</Button>
          </div>
        </Card>

        {/* Loading States */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">加载状态 Loading</h2>
          <div className="flex flex-wrap items-center gap-6">
            <LoadingSpinner size="sm" />
            <LoadingSpinner size="md" />
            <LoadingSpinner size="lg" />
            <LoadingSpinner size="xl" />
          </div>
          <div className="mt-6 p-8 bg-surface-50 dark:bg-surface-900 rounded-xl">
            <LoadingSpinner centered text="加载中..." />
          </div>
        </Card>

        {/* Skeleton */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">骨架屏 Skeleton</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton circle width={48} height={48} />
              <div className="flex-1 space-y-2">
                <Skeleton width="60%" height={20} />
                <Skeleton width="40%" height={16} />
              </div>
            </div>
            <Skeleton count={3} height={16} />
          </div>
        </Card>

        {/* Empty State */}
        <Card>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">空状态 EmptyState</h2>
          <EmptyState 
            title="暂无数据"
            description="当前列表为空，点击下方按钮添加数据"
            action={{ label: '添加数据', onClick: () => alert('添加数据') }}
          />
        </Card>
      </div>

      {/* Demo Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="示例弹窗"
        description="这是一个示例弹窗组件"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button onClick={() => setShowModal(false)}>
              确认
            </Button>
          </div>
        }
      >
        <p className="text-surface-600 dark:text-surface-400">
          这是弹窗的内容区域。您可以在这里放置任何内容，如表单、文本、图片等。
        </p>
      </Modal>
    </div>
  )
}
