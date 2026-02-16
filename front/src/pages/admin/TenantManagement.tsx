import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components'
import { tenantsApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/solid'

interface Tenant {
  id: string
  name: string
  code: string
  logo?: string
  description?: string
  isEnabled: boolean
  expiredAt?: string
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    logo: '',
    description: '',
    isEnabled: true,
    expiredAt: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const response = await tenantsApi.apiTenantListGet()
      const data = (response.data.data as Tenant[]) || []
      setTenants(data)
      setFilteredTenants(data)
    } catch (error) {
      showToast('获取租户列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  // Filter tenants based on search query and pagination
  useEffect(() => {
    let filtered = tenants
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = tenants.filter(tenant => 
        tenant.name.toLowerCase().includes(query) ||
        tenant.code.toLowerCase().includes(query) ||
        tenant.description?.toLowerCase().includes(query)
      )
    }
    
    setPagination(prev => ({ ...prev, total: filtered.length }))
    
    // 客户端分页
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    setFilteredTenants(filtered.slice(start, end))
  }, [searchQuery, tenants, pagination.current, pagination.pageSize])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入租户名称'
    }
    if (!formData.code.trim()) {
      errors.code = '请输入租户编码'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingTenant) {
        await tenantsApi.apiTenantUpsertPost({
          id: editingTenant.id,
          ...formData,
        })
        showToast('租户更新成功', 'success')
      } else {
        await tenantsApi.apiTenantUpsertPost(formData)
        showToast('租户创建成功', 'success')
      }
      closeModal()
      fetchTenants()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      code: tenant.code,
      logo: tenant.logo || '',
      description: tenant.description || '',
      isEnabled: tenant.isEnabled,
      expiredAt: tenant.expiredAt ? new Date(tenant.expiredAt).toISOString().split('T')[0] : '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = (tenant: Tenant) => {
    setDeletingTenant(tenant)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingTenant) return
    try {
      await tenantsApi.apiTenantDeleteDelete({ ids: [deletingTenant.id] })
      showToast('删除成功', 'success')
      fetchTenants()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingTenant(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTenant(null)
    setFormData({ name: '', code: '', logo: '', description: '', isEnabled: true, expiredAt: '' })
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingTenant(null)
    setFormData({ name: '', code: '', logo: '', description: '', isEnabled: true, expiredAt: '' })
    setFormErrors({})
    setShowModal(true)
  }

  const isExpired = (expiredAt?: string) => {
    if (!expiredAt) return false
    return new Date(expiredAt) < new Date()
  }

  const columns = [
    {
      key: 'name',
      title: '租户名称',
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
            <BuildingOfficeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{tenant.name}</div>
            <div className="text-xs text-surface-500">{tenant.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: '状态',
      render: (tenant: Tenant) => {
        if (isExpired(tenant.expiredAt)) {
          return <Badge variant="danger" size="sm">已过期</Badge>
        }
        return tenant.isEnabled ? 
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            启用
          </Badge> : 
          <Badge variant="default" size="sm" className="flex items-center gap-1">
            <XCircleIcon className="w-3 h-3" />
            禁用
          </Badge>
      }
    },
    {
      key: 'expiredAt',
      title: '过期时间',
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-surface-400" />
          <span className={`text-sm ${isExpired(tenant.expiredAt) ? 'text-red-500' : 'text-surface-600 dark:text-surface-400'}`}>
            {tenant.expiredAt ? new Date(tenant.expiredAt).toLocaleDateString() : '永不过期'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (tenant: Tenant) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(tenant)}
            className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="编辑"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(tenant)}
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">租户管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理多租户系统的租户信息
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增租户
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索租户名称或编码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button 
            variant="secondary" 
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchTenants}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredTenants.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的租户' : '暂无租户'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个租户'}
            action={!searchQuery ? { label: '新增租户', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTenants}
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
        title={editingTenant ? '编辑租户' : '新增租户'}
        description={editingTenant ? '修改租户信息' : '创建新租户'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingTenant ? '保存修改' : '创建'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="租户名称"
              placeholder="请输入租户名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="租户编码"
              placeholder="例如: company_a"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={formErrors.code}
              required
            />
          </div>

          <Input
            label="Logo URL"
            placeholder="请输入 Logo 地址"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">过期时间</label>
              <input
                type="date"
                value={formData.expiredAt}
                onChange={(e) => setFormData({ ...formData, expiredAt: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">启用</span>
              </label>
            </div>
          </div>

          <Input
            label="描述"
            placeholder="请输入租户描述"
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
        description={`确定要删除租户 "${deletingTenant?.name}" 吗？此操作不可恢复。`}
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
