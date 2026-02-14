import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components'
import { gitCredentialApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  KeyIcon,
  ArrowPathIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid'

interface GitCredential {
  id: string
  gitAccountId: string
  type: number
  name: string
  encryptedSecret: string
  publicKey?: string
  passphraseEncrypted?: string
  isActive: boolean
  lastUsedAt?: string
  notes?: string
}

const typeNames: Record<number, string> = {
  0: '密码',
  1: 'SSH 密钥',
  2: '个人访问令牌',
}

const typeColors: Record<number, string> = {
  0: 'bg-blue-500',
  1: 'bg-green-500',
  2: 'bg-purple-500',
}

export default function GitCredentialManagement() {
  const [credentials, setCredentials] = useState<GitCredential[]>([])
  const [filteredCredentials, setFilteredCredentials] = useState<GitCredential[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingCredential, setEditingCredential] = useState<GitCredential | null>(null)
  const [deletingCredential, setDeletingCredential] = useState<GitCredential | null>(null)
  const [formData, setFormData] = useState({
    gitAccountId: '',
    type: 0,
    name: '',
    encryptedSecret: '',
    publicKey: '',
    passphraseEncrypted: '',
    isActive: true,
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

  const fetchCredentials = async () => {
    setLoading(true)
    try {
      const response = await gitCredentialApi.apiGitCredentialListGet()
      const data = (response.data.data as GitCredential[]) || []
      setCredentials(data)
      setFilteredCredentials(data)
    } catch (error) {
      showToast('获取 Git 凭据列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredentials()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCredentials(credentials)
      return
    }
    const query = searchQuery.toLowerCase()
    const filtered = credentials.filter(cred => 
      cred.name.toLowerCase().includes(query) ||
      cred.notes?.toLowerCase().includes(query)
    )
    setFilteredCredentials(filtered)
  }, [searchQuery, credentials])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入名称'
    }
    if (!formData.gitAccountId.trim()) {
      errors.gitAccountId = '请输入 Git 账号 ID'
    }
    if (!formData.encryptedSecret.trim()) {
      errors.encryptedSecret = '请输入密钥'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingCredential) {
        await gitCredentialApi.apiGitCredentialUpsertPost({
          id: editingCredential.id,
          ...formData,
        })
        showToast('Git 凭据更新成功', 'success')
      } else {
        await gitCredentialApi.apiGitCredentialUpsertPost(formData)
        showToast('Git 凭据创建成功', 'success')
      }
      closeModal()
      fetchCredentials()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (cred: GitCredential) => {
    setEditingCredential(cred)
    setFormData({
      gitAccountId: cred.gitAccountId,
      type: cred.type,
      name: cred.name,
      encryptedSecret: cred.encryptedSecret,
      publicKey: cred.publicKey || '',
      passphraseEncrypted: cred.passphraseEncrypted || '',
      isActive: cred.isActive,
      notes: cred.notes || '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = (cred: GitCredential) => {
    setDeletingCredential(cred)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingCredential) return
    try {
      await gitCredentialApi.apiGitCredentialDeleteDelete({ ids: [deletingCredential.id] })
      showToast('删除成功', 'success')
      fetchCredentials()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingCredential(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCredential(null)
    setFormData({
      gitAccountId: '',
      type: 0,
      name: '',
      encryptedSecret: '',
      publicKey: '',
      passphraseEncrypted: '',
      isActive: true,
      notes: '',
    })
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingCredential(null)
    setFormData({
      gitAccountId: '',
      type: 0,
      name: '',
      encryptedSecret: '',
      publicKey: '',
      passphraseEncrypted: '',
      isActive: true,
      notes: '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const getTypeBadge = (type: number) => {
    return (
      <Badge 
        variant="default" 
        size="sm" 
        className={typeColors[type] || 'bg-gray-500'}
      >
        {typeNames[type] || 'Unknown'}
      </Badge>
    )
  }

  const columns = [
    {
      key: 'name',
      title: '名称',
      render: (cred: GitCredential) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
            <KeyIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{cred.name}</div>
            <div className="text-xs text-surface-500">{cred.gitAccountId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: '类型',
      render: (cred: GitCredential) => getTypeBadge(cred.type)
    },
    {
      key: 'status',
      title: '状态',
      render: (cred: GitCredential) => (
        cred.isActive ? 
          <Badge variant="success" size="sm">启用</Badge> : 
          <Badge variant="default" size="sm">禁用</Badge>
      )
    },
    {
      key: 'lastUsed',
      title: '最后使用',
      render: (cred: GitCredential) => (
        <span className="text-sm text-surface-500">
          {cred.lastUsedAt ? new Date(cred.lastUsedAt).toLocaleString() : '从未使用'}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (cred: GitCredential) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(cred)}
            className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="编辑"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(cred)}
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
    <div className="container-main py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Git 凭据管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理 Git 仓库访问凭据
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增凭据
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索凭据名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button 
            variant="secondary" 
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchCredentials}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredCredentials.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的凭据' : '暂无 Git 凭据'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个凭据'}
            action={!searchQuery ? { label: '新增凭据', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredCredentials}
            rowKey="id"
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCredential ? '编辑 Git 凭据' : '新增 Git 凭据'}
        description={editingCredential ? '修改凭据信息' : '创建新的 Git 凭据'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingCredential ? '保存修改' : '创建'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="名称"
              placeholder="请输入名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <div>
              <label className="form-label">类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {Object.entries(typeNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Git 账号 ID"
            placeholder="请输入 Git 账号 ID"
            value={formData.gitAccountId}
            onChange={(e) => setFormData({ ...formData, gitAccountId: e.target.value })}
            error={formErrors.gitAccountId}
            required
          />

          <Input
            label="密钥 / 密码 / 令牌"
            type="password"
            placeholder="请输入密钥"
            value={formData.encryptedSecret}
            onChange={(e) => setFormData({ ...formData, encryptedSecret: e.target.value })}
            error={formErrors.encryptedSecret}
            required
          />

          {formData.type === 1 && (
            <>
              <Input
                label="公钥"
                placeholder="请输入 SSH 公钥"
                value={formData.publicKey}
                onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
              />
              <Input
                label="私钥口令"
                type="password"
                placeholder="如果私钥有口令保护，请输入"
                value={formData.passphraseEncrypted}
                onChange={(e) => setFormData({ ...formData, passphraseEncrypted: e.target.value })}
              />
            </>
          )}

          <Input
            label="备注"
            placeholder="请输入备注"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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
        description={`确定要删除 Git 凭据 "${deletingCredential?.name}" 吗？此操作不可恢复。`}
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
