import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components'
import { fileResourcesApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  DocumentIcon,
  ArrowPathIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid'

interface FileResource {
  id: string
  name: string
  location: string
  description?: string
  isEnabled: boolean
}

export default function FileResourceManagement() {
  const [fileResources, setFileResources] = useState<FileResource[]>([])
  const [filteredFileResources, setFilteredFileResources] = useState<FileResource[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingFileResource, setEditingFileResource] = useState<FileResource | null>(null)
  const [deletingFileResource, setDeletingFileResource] = useState<FileResource | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    isEnabled: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

  const fetchFileResources = async () => {
    setLoading(true)
    try {
      const response = await fileResourcesApi.apiFileResourceListGet()
      const data = (response.data.data as FileResource[]) || []
      setFileResources(data)
      setFilteredFileResources(data)
    } catch (error) {
      showToast('获取文件资源列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFileResources()
  }, [])

  useEffect(() => {
    let filtered = fileResources
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = fileResources.filter(file => 
        file.name.toLowerCase().includes(query) ||
        file.location.toLowerCase().includes(query) ||
        file.description?.toLowerCase().includes(query)
      )
    }
    setPagination(prev => ({ ...prev, total: filtered.length }))
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    setFilteredFileResources(filtered.slice(start, end))
  }, [searchQuery, fileResources, pagination.current, pagination.pageSize])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入文件名称'
    }
    if (!formData.location.trim()) {
      errors.location = '请输入文件路径'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingFileResource) {
        await fileResourcesApi.apiFileResourceUpsertPost({
          id: editingFileResource.id,
          ...formData,
        })
        showToast('文件资源更新成功', 'success')
      } else {
        await fileResourcesApi.apiFileResourceUpsertPost(formData)
        showToast('文件资源创建成功', 'success')
      }
      closeModal()
      fetchFileResources()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (file: FileResource) => {
    setEditingFileResource(file)
    setFormData({
      name: file.name,
      location: file.location,
      description: file.description || '',
      isEnabled: file.isEnabled,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = (file: FileResource) => {
    setDeletingFileResource(file)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingFileResource) return
    try {
      await fileResourcesApi.apiFileResourceDeleteDelete({ ids: [deletingFileResource.id] })
      showToast('删除成功', 'success')
      fetchFileResources()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingFileResource(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingFileResource(null)
    setFormData({ name: '', location: '', description: '', isEnabled: true })
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingFileResource(null)
    setFormData({ name: '', location: '', description: '', isEnabled: true })
    setFormErrors({})
    setShowModal(true)
  }

  const columns = [
    {
      key: 'name',
      title: '文件名称',
      render: (file: FileResource) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white">
            <DocumentIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{file.name}</div>
            {file.description && (
              <div className="text-xs text-surface-500">{file.description}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'location',
      title: '文件路径',
      render: (file: FileResource) => (
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-surface-400" />
          <span className="text-sm text-surface-600 dark:text-surface-400 truncate max-w-xs">
            {file.location}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      title: '状态',
      render: (file: FileResource) => (
        file.isEnabled ? 
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            启用
          </Badge> : 
          <Badge variant="default" size="sm" className="flex items-center gap-1">
            <XCircleIcon className="w-3 h-3" />
            禁用
          </Badge>
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (file: FileResource) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(file)}
            className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="编辑"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(file)}
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">文件资源管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理系统文件资源和存储位置
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增文件资源
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索文件名称或路径..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button 
            variant="secondary" 
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchFileResources}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredFileResources.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的文件资源' : '暂无文件资源'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个文件资源'}
            action={!searchQuery ? { label: '新增文件资源', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredFileResources}
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
        title={editingFileResource ? '编辑文件资源' : '新增文件资源'}
        description={editingFileResource ? '修改文件资源信息' : '创建新文件资源'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingFileResource ? '保存修改' : '创建'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <Input
            label="文件名称"
            placeholder="请输入文件名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <Input
            label="文件路径"
            placeholder="例如: /uploads/documents/file.pdf"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            error={formErrors.location}
            required
          />

          <Input
            label="描述"
            placeholder="请输入文件描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isEnabled}
              onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
              className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-surface-700 dark:text-surface-300">启用</span>
          </label>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除"
        description={`确定要删除文件资源 "${deletingFileResource?.name}" 吗？此操作不可恢复。`}
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
