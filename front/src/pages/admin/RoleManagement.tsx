import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components'
import { rolesApi, permissionsApi, rolePermissionApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  KeyIcon
} from '@heroicons/react/24/solid'

interface Role {
  id: string
  name: string
  code: string
  description?: string
}

interface Permission {
  id: string
  name: string
  code: string
  description?: string
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const response = await rolesApi.apiRoleListGet()
      const data = (response.data.data as Role[]) || []
      setRoles(data)
      setFilteredRoles(data)
    } catch (error) {
      showToast('获取角色列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await permissionsApi.apiPermissionListGet()
      setPermissions((response.data.data as Permission[]) || [])
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  // Filter roles based on search query and pagination
  useEffect(() => {
    let filtered = roles
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = roles.filter(role => 
        role.name.toLowerCase().includes(query) ||
        role.code.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
      )
    }
    
    setPagination(prev => ({ ...prev, total: filtered.length }))
    
    // 客户端分页
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    setFilteredRoles(filtered.slice(start, end))
  }, [searchQuery, roles, pagination.current, pagination.pageSize])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入角色名称'
    }
    if (!formData.code.trim()) {
      errors.code = '请输入角色编码'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingRole) {
        await rolesApi.apiRoleUpsertPost({
            id: editingRole.id,
            ...formData,
          })
        await rolePermissionApi.apiRolePermissionAssignPost({
            roleId: editingRole.id,
            permissionIds: selectedPermissions,
          })
        showToast('角色更新成功', 'success')
      } else {
        const response = await rolesApi.apiRoleUpsertPost(formData)
        const newRoleId = (response.data.data as any)?.id
        if (newRoleId && selectedPermissions.length > 0) {
          await rolePermissionApi.apiRolePermissionAssignPost({
              roleId: newRoleId,
              permissionIds: selectedPermissions,
            })
        }
        showToast('角色创建成功', 'success')
      }
      closeModal()
      fetchRoles()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = async (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
    })
    try {
      const response = await rolesApi.apiRoleGetRolePermissionsIdPermissionsGet(role.id)
      const rolePermissions = (response.data.data as any[]) || []
      setSelectedPermissions(rolePermissions.map(p => p.id))
    } catch (error) {
      setSelectedPermissions([])
    }
    setShowModal(true)
  }

  const handleDelete = (role: Role) => {
    setDeletingRole(role)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingRole) return
    try {
      await rolesApi.apiRoleDeleteDelete({ ids: [deletingRole.id] })
      showToast('删除成功', 'success')
      fetchRoles()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingRole(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRole(null)
    setFormData({ name: '', code: '', description: '' })
    setSelectedPermissions([])
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingRole(null)
    setFormData({ name: '', code: '', description: '' })
    setSelectedPermissions([])
    setFormErrors({})
    setShowModal(true)
  }

  const columns = [
    {
      key: 'name',
      title: '角色名称',
      render: (role: Role) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{role.name}</div>
            <div className="text-xs text-surface-500">{role.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'description',
      title: '描述',
      render: (role: Role) => (
        <span className="text-surface-600 dark:text-surface-400">
          {role.description || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (role: Role) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(role)}
            className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="编辑"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(role)}
            className="p-2 rounded-lg text-surface-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="删除"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">角色管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            配置系统角色及权限分配
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增角色
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索角色名称或编码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button 
            variant="secondary" 
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchRoles}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的角色' : '暂无角色'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个角色'}
            action={!searchQuery ? { label: '新增角色', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredRoles}
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
        title={editingRole ? '编辑角色' : '新增角色'}
        description={editingRole ? '修改角色信息和权限' : '创建新角色并分配权限'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingRole ? '保存修改' : '创建角色'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="角色名称"
              placeholder="请输入角色名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="角色编码"
              placeholder="请输入角色编码"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={formErrors.code}
              required
            />
          </div>

          <Input
            label="描述"
            placeholder="请输入角色描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div>
            <label className="form-label">权限分配</label>
            <div className="border border-surface-300 dark:border-surface-600 rounded-xl p-4 max-h-64 overflow-y-auto">
              {permissions.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">暂无可用权限</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {permissions.map(permission => (
                    <label key={permission.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id])
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id))
                          }
                        }}
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex items-center gap-2">
                        <KeyIcon className="w-4 h-4 text-surface-400" />
                        <div>
                          <span className="text-sm font-medium text-surface-900 dark:text-white">
                            {permission.name}
                          </span>
                          <span className="text-xs text-surface-500 ml-1">({permission.code})</span>
                        </div>
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
        description={`确定要删除角色 "${deletingRole?.name}" 吗？此操作不可恢复。`}
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
