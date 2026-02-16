import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner, Tooltip } from '../../components'
import { usersApi, rolesApi, userRoleApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid'

interface User {
  id: string
  account: string
  name: string
  email: string
  phone: string
  isSuper: boolean
  createdAt?: string
}

interface Role {
  id: string
  name: string
  code: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    account: '',
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await usersApi.apiUserListGet()
      const data = (response.data.data as User[]) || []
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      showToast('获取用户列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.apiRoleListGet()
      setRoles((response.data.data as Role[]) || [])
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  // Filter users based on search query and pagination
  useEffect(() => {
    let filtered = users
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = users.filter(user => 
        user.account.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.includes(query)
      )
    }
    
    setPagination(prev => ({ ...prev, total: filtered.length }))
    
    // 客户端分页
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    setFilteredUsers(filtered.slice(start, end))
  }, [searchQuery, users, pagination.current, pagination.pageSize])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.account.trim()) {
      errors.account = '请输入账号'
    }
    if (!editingUser && !formData.password) {
      errors.password = '请输入密码'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingUser) {
        await usersApi.apiUserUpsertPost({
            id: editingUser.id,
            ...formData,
          })
        await userRoleApi.apiUserRoleAssignPost({
            userId: editingUser.id,
            roleIds: selectedRoles,
          })
        showToast('用户更新成功', 'success')
      } else {
        const response = await usersApi.apiUserUpsertPost(formData)
        const newUserId = (response.data.data as any)?.id
        if (newUserId && selectedRoles.length > 0) {
          await userRoleApi.apiUserRoleAssignPost({
              userId: newUserId,
              roleIds: selectedRoles,
            })
        }
        showToast('用户创建成功', 'success')
      }
      closeModal()
      fetchUsers()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = async (user: User) => {
    setEditingUser(user)
    setFormData({
      account: user.account,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
    })
    try {
      const response = await usersApi.apiUserGetUserRolesIdRolesGet(user.id)
      const userRoles = (response.data.data as any[]) || []
      setSelectedRoles(userRoles.map(r => r.id))
    } catch (error) {
      setSelectedRoles([])
    }
    setShowModal(true)
  }

  const handleDelete = (user: User) => {
    setDeletingUser(user)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingUser) return
    try {
      await usersApi.apiUserDeleteDelete({ ids: [deletingUser.id] })
      showToast('删除成功', 'success')
      fetchUsers()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingUser(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ account: '', name: '', email: '', phone: '', password: '' })
    setSelectedRoles([])
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ account: '', name: '', email: '', phone: '', password: '' })
    setSelectedRoles([])
    setFormErrors({})
    setShowModal(true)
  }

  const columns = [
    {
      key: 'account',
      title: '账号',
      dataIndex: 'account' as keyof User,
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
            {user.name?.[0] || user.account[0]}
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{user.account}</div>
            {user.name && (
              <div className="text-xs text-surface-500">{user.name}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      title: '邮箱',
      dataIndex: 'email' as keyof User,
      render: (user: User) => (
        <span className="text-surface-600 dark:text-surface-400">
          {user.email || '-'}
        </span>
      )
    },
    {
      key: 'phone',
      title: '电话',
      dataIndex: 'phone' as keyof User,
      render: (user: User) => (
        <span className="text-surface-600 dark:text-surface-400">
          {user.phone || '-'}
        </span>
      )
    },
    {
      key: 'isSuper',
      title: '权限',
      render: (user: User) => (
        user.isSuper ? (
          <Badge variant="danger" size="sm">超级管理员</Badge>
        ) : (
          <Badge variant="default" size="sm">普通用户</Badge>
        )
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (user: User) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip content="编辑" placement="top">
            <button
              onClick={() => handleEdit(user)}
              className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="删除" placement="top">
            <button
              onClick={() => handleDelete(user)}
              className="p-2 rounded-lg text-surface-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      )
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">用户管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理系统用户及其角色权限
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增用户
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索账号、姓名、邮箱或电话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<FunnelIcon className="w-4 h-4" />}>
              筛选
            </Button>
            <Button 
              variant="secondary" 
              leftIcon={<ArrowPathIcon className="w-4 h-4" />}
              onClick={fetchUsers}
            >
              刷新
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的用户' : '暂无用户'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个用户'}
            action={!searchQuery ? { label: '新增用户', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            noBorder
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
            }}
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingUser ? '编辑用户' : '新增用户'}
        description={editingUser ? '修改用户信息和角色权限' : '创建新用户并分配角色'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingUser ? '保存修改' : '创建用户'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="账号"
              placeholder="请输入账号"
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              error={formErrors.account}
              required
            />
            <Input
              label="姓名"
              placeholder="请输入姓名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="邮箱"
              type="email"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
            />
            <Input
              label="电话"
              placeholder="请输入电话"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Input
            label={`密码 ${editingUser ? '(留空表示不修改)' : ''}`}
            type="password"
            placeholder="请输入密码"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formErrors.password}
            required={!editingUser}
          />

          <div>
            <label className="form-label">角色分配</label>
            <div className="border border-surface-300 dark:border-surface-600 rounded-xl p-4 max-h-48 overflow-y-auto">
              {roles.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">暂无可用角色</p>
              ) : (
                <div className="space-y-2">
                  {roles.map(role => (
                    <label key={role.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoles([...selectedRoles, role.id])
                          } else {
                            setSelectedRoles(selectedRoles.filter(id => id !== role.id))
                          }
                        }}
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {role.name}
                        </span>
                        <span className="text-xs text-surface-500 ml-2">({role.code})</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除"
        description={`确定要删除用户 "${deletingUser?.account}" 吗？此操作不可恢复。`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              确认删除
            </Button>
          </div>
        }
      />
    </div>
  )
}
