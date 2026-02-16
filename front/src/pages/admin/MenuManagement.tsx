import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner, Select, Tooltip } from '../../components'
import { menusApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ListBulletIcon,
  ArrowPathIcon,
  LinkIcon,
  FolderIcon
} from '@heroicons/react/24/solid'

interface Menu {
  id: string
  name: string
  code: string
  description?: string
  parentId?: string
  url?: string
  icon?: string
  sort: number
}

export default function MenuManagement() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [filteredMenus, setFilteredMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [deletingMenu, setDeletingMenu] = useState<Menu | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentId: '',
    url: '',
    icon: '',
    sort: 0,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const fetchMenus = async () => {
    setLoading(true)
    try {
      const response = await menusApi.apiMenuListGet()
      const data = (response.data.data as Menu[]) || []
      setMenus(data)
      setFilteredMenus(data)
    } catch (error) {
      showToast('获取菜单列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenus()
  }, [])

  // Filter menus based on search query and pagination
  useEffect(() => {
    let filtered = menus
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = menus.filter(menu => 
        menu.name.toLowerCase().includes(query) ||
        menu.code.toLowerCase().includes(query) ||
        menu.description?.toLowerCase().includes(query)
      )
    }
    
    setPagination(prev => ({ ...prev, total: filtered.length }))
    
    // 客户端分页
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    setFilteredMenus(filtered.slice(start, end))
  }, [searchQuery, menus, pagination.current, pagination.pageSize])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入菜单名称'
    }
    if (!formData.code.trim()) {
      errors.code = '请输入菜单编码'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingMenu) {
        await menusApi.apiMenuUpsertPost({
          id: editingMenu.id,
          ...formData,
        })
        showToast('菜单更新成功', 'success')
      } else {
        await menusApi.apiMenuUpsertPost(formData)
        showToast('菜单创建成功', 'success')
      }
      closeModal()
      fetchMenus()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      code: menu.code,
      description: menu.description || '',
      parentId: menu.parentId || '',
      url: menu.url || '',
      icon: menu.icon || '',
      sort: menu.sort,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = (menu: Menu) => {
    setDeletingMenu(menu)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingMenu) return
    try {
      await menusApi.apiMenuDeleteDelete({ ids: [deletingMenu.id] })
      showToast('删除成功', 'success')
      fetchMenus()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingMenu(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingMenu(null)
    setFormData({ name: '', code: '', description: '', parentId: '', url: '', icon: '', sort: 0 })
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingMenu(null)
    setFormData({ name: '', code: '', description: '', parentId: '', url: '', icon: '', sort: 0 })
    setFormErrors({})
    setShowModal(true)
  }

  const getParentName = (parentId?: string) => {
    if (!parentId) return '-'
    return menus.find(m => m.id === parentId)?.name || '未知'
  }

  const columns = [
    {
      key: 'name',
      title: '菜单名称',
      render: (menu: Menu) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white">
            <ListBulletIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{menu.name}</div>
            <div className="text-xs text-surface-500">{menu.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'url',
      title: '链接',
      render: (menu: Menu) => (
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-surface-400" />
          <span className="text-sm text-surface-600 dark:text-surface-400 truncate max-w-xs">
            {menu.url || '-'}
          </span>
        </div>
      )
    },
    {
      key: 'parent',
      title: '父菜单',
      render: (menu: Menu) => (
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-surface-400" />
          <span className="text-sm text-surface-600 dark:text-surface-400">
            {getParentName(menu.parentId)}
          </span>
        </div>
      )
    },
    {
      key: 'sort',
      title: '排序',
      render: (menu: Menu) => (
        <Badge variant="default" size="sm">{menu.sort}</Badge>
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (menu: Menu) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip content="编辑" placement="top">
            <button
              onClick={() => handleEdit(menu)}
              className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="删除" placement="top">
            <button
              onClick={() => handleDelete(menu)}
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">菜单管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理系统菜单结构和导航
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增菜单
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索菜单名称或编码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button 
            variant="secondary" 
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchMenus}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredMenus.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的菜单' : '暂无菜单'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个菜单'}
            action={!searchQuery ? { label: '新增菜单', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredMenus}
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
        title={editingMenu ? '编辑菜单' : '新增菜单'}
        description={editingMenu ? '修改菜单信息' : '创建新菜单'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingMenu ? '保存修改' : '创建'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="菜单名称"
              placeholder="请输入菜单名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="菜单编码"
              placeholder="例如: user_management"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={formErrors.code}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="父菜单"
              value={formData.parentId}
              onChange={(value) => setFormData({ ...formData, parentId: value })}
              options={[{ value: '', label: '-- 作为一级菜单 --' }, ...menus
                .filter(m => m.id !== editingMenu?.id)
                .map(menu => ({ value: menu.id, label: menu.name }))]}
            />
            <Input
              label="排序"
              type="number"
              placeholder="0"
              value={formData.sort.toString()}
              onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
            />
          </div>

          <Input
            label="URL 路径"
            placeholder="例如: /users"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />

          <Input
            label="图标"
            placeholder="例如: UsersIcon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          />

          <Input
            label="描述"
            placeholder="请输入菜单描述"
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
        description={`确定要删除菜单 "${deletingMenu?.name}" 吗？此操作不可恢复。`}
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
