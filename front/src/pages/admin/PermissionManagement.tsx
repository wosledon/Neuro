import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components'
import { permissionsApi, menusApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  LockClosedIcon,
  ArrowPathIcon,
  LinkIcon
} from '@heroicons/react/24/solid'

interface Permission {
  id: string
  name: string
  code: string
  description?: string
  menuId?: string
  action?: string
  method?: string
}

interface Menu {
  id: string
  name: string
}

export default function PermissionManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    menuId: '',
    action: '',
    method: 'GET',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

  const fetchPermissions = async () => {
    setLoading(true)
    try {
      const response = await permissionsApi.apiPermissionListGet()
      const data = (response.data.data as Permission[]) || []
      setPermissions(data)
      setFilteredPermissions(data)
    } catch (error) {
      showToast('获取权限列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await menusApi.apiMenuListGet()
      setMenus((response.data.data as Menu[]) || [])
    } catch (error) {
      console.error('Failed to fetch menus:', error)
    }
  }

  useEffect(() => {
    fetchPermissions()
    fetchMenus()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPermissions(permissions)
      return
    }
    const query = searchQuery.toLowerCase()
    const filtered = permissions.filter(perm => 
      perm.name.toLowerCase().includes(query) ||
      perm.code.toLowerCase().includes(query) ||
      perm.description?.toLowerCase().includes(query)
    )
    setFilteredPermissions(filtered)
  }, [searchQuery, permissions])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入权限名称'
    }
    if (!formData.code.trim()) {
      errors.code = '请输入权限编码'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingPermission) {
        await permissionsApi.apiPermissionUpsertPost({
          id: editingPermission.id,
          ...formData,
        })
        showToast('权限更新成功', 'success')
      } else {
        await permissionsApi.apiPermissionUpsertPost(formData)
        showToast('权限创建成功', 'success')
      }
      closeModal()
      fetchPermissions()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (perm: Permission) => {
    setEditingPermission(perm)
    setFormData({
      name: perm.name,
      code: perm.code,
      description: perm.description || '',
      menuId: perm.menuId || '',
      action: perm.action || '',
      method: perm.method || 'GET',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = (perm: Permission) => {
    setDeletingPermission(perm)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingPermission) return
    try {
      await permissionsApi.apiPermissionDeleteDelete({ ids: [deletingPermission.id] })
      showToast('删除成功', 'success')
      fetchPermissions()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingPermission(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPermission(null)
    setFormData({ name: '', code: '', description: '', menuId: '', action: '', method: 'GET' })
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingPermission(null)
    setFormData({ name: '', code: '', description: '', menuId: '', action: '', method: 'GET' })
    setFormErrors({})
    setShowModal(true)
  }

  const getMenuName = (menuId?: string) => {
    if (!menuId) return '-'
    return menus.find(m => m.id === menuId)?.name || '未知菜单'
  }

  const columns = [
    {
      key: 'name',
      title: '权限名称',
      render: (perm: Permission) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
            <LockClosedIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{perm.name}</div>
            <div className="text-xs text-surface-500">{perm.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'menu',
      title: '关联菜单',
      render: (perm: Permission) => (
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-surface-400" />
          <span className="text-sm text-surface-600 dark:text-surface-400">
            {getMenuName(perm.menuId)}
          </span>
        </div>
      )
    },
    {
      key: 'action',
      title: '操作/方法',
      render: (perm: Permission) => (
        <div className="text-sm">
          {perm.action && (
            <div className="text-surface-600 dark:text-surface-400">{perm.action}</div>
          )}
          {perm.method && (
            <Badge variant="primary" size="sm">{perm.method}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (perm: Permission) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(perm)}
            className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="编辑"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(perm)}
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">权限管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理系统权限和 API 接口权限
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增权限
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索权限名称或编码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button 
            variant="secondary" 
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchPermissions}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredPermissions.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的权限' : '暂无权限'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个权限'}
            action={!searchQuery ? { label: '新增权限', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredPermissions}
            rowKey="id"
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingPermission ? '编辑权限' : '新增权限'}
        description={editingPermission ? '修改权限信息' : '创建新权限'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingPermission ? '保存修改' : '创建'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="权限名称"
              placeholder="请输入权限名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="权限编码"
              placeholder="例如: user:create"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={formErrors.code}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">关联菜单</label>
              <select
                value={formData.menuId}
                onChange={(e) => setFormData({ ...formData, menuId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">-- 选择菜单 --</option>
                {menus.map(menu => (
                  <option key={menu.id} value={menu.id}>{menu.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">HTTP 方法</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
          </div>

          <Input
            label="Action 路径"
            placeholder="例如: /api/users/create"
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
          />

          <Input
            label="描述"
            placeholder="请输入权限描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除"
        description={`确定要删除权限 "${deletingPermission?.name}" 吗？此操作不可恢复。`}
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
