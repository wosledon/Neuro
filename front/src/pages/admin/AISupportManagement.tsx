import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components'
import { aiSupportApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  CpuChipIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/solid'

interface AISupport {
  id: string
  name: string
  provider: number
  apiKey: string
  endpoint: string
  description?: string
  isEnabled: boolean
  isPin: boolean
  modelName: string
  maxTokens: number
  temperature: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  customParameters?: string
  sort: number
}

const providerNames: Record<number, string> = {
  0: 'OpenAI',
  1: 'Azure OpenAI',
  2: 'Hugging Face',
  10: 'OpenAI Embedding',
  11: 'Azure OpenAI Embedding',
  12: 'Hugging Face Embedding',
  13: 'Sentence Transformers',
  14: 'Cohere',
  15: 'Local Model Embedding',
}

export default function AISupportManagement() {
  const [aiSupports, setAiSupports] = useState<AISupport[]>([])
  const [filteredAiSupports, setFilteredAiSupports] = useState<AISupport[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingAiSupport, setEditingAiSupport] = useState<AISupport | null>(null)
  const [deletingAiSupport, setDeletingAiSupport] = useState<AISupport | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    provider: 0,
    apiKey: '',
    endpoint: '',
    description: '',
    isEnabled: true,
    isPin: false,
    modelName: 'gpt-4',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    customParameters: '',
    sort: 0,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

  const fetchAiSupports = async () => {
    setLoading(true)
    try {
      const response = await aiSupportApi.apiAISupportListGet()
      const data = (response.data.data as AISupport[]) || []
      setAiSupports(data)
      setFilteredAiSupports(data)
    } catch (error) {
      showToast('获取 AI 助手列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAiSupports()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAiSupports(aiSupports)
      return
    }
    const query = searchQuery.toLowerCase()
    const filtered = aiSupports.filter(ai => 
      ai.name.toLowerCase().includes(query) ||
      ai.modelName.toLowerCase().includes(query) ||
      ai.description?.toLowerCase().includes(query)
    )
    setFilteredAiSupports(filtered)
  }, [searchQuery, aiSupports])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入名称'
    }
    if (!formData.apiKey.trim()) {
      errors.apiKey = '请输入 API Key'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingAiSupport) {
        await aiSupportApi.apiAISupportUpsertPost({
          id: editingAiSupport.id,
          ...formData,
        })
        showToast('AI 助手更新成功', 'success')
      } else {
        await aiSupportApi.apiAISupportUpsertPost(formData)
        showToast('AI 助手创建成功', 'success')
      }
      closeModal()
      fetchAiSupports()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (ai: AISupport) => {
    setEditingAiSupport(ai)
    setFormData({
      name: ai.name,
      provider: ai.provider,
      apiKey: ai.apiKey,
      endpoint: ai.endpoint,
      description: ai.description || '',
      isEnabled: ai.isEnabled,
      isPin: ai.isPin,
      modelName: ai.modelName,
      maxTokens: ai.maxTokens,
      temperature: ai.temperature,
      topP: ai.topP,
      frequencyPenalty: ai.frequencyPenalty,
      presencePenalty: ai.presencePenalty,
      customParameters: ai.customParameters || '',
      sort: ai.sort,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = (ai: AISupport) => {
    setDeletingAiSupport(ai)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingAiSupport) return
    try {
      await aiSupportApi.apiAISupportDeleteDelete({ ids: [deletingAiSupport.id] })
      showToast('删除成功', 'success')
      fetchAiSupports()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingAiSupport(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingAiSupport(null)
    setFormData({
      name: '',
      provider: 0,
      apiKey: '',
      endpoint: '',
      description: '',
      isEnabled: true,
      isPin: false,
      modelName: 'gpt-4',
      maxTokens: 2048,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      customParameters: '',
      sort: 0,
    })
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingAiSupport(null)
    setFormData({
      name: '',
      provider: 0,
      apiKey: '',
      endpoint: '',
      description: '',
      isEnabled: true,
      isPin: false,
      modelName: 'gpt-4',
      maxTokens: 2048,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      customParameters: '',
      sort: 0,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const getProviderBadge = (provider: number) => {
    const name = providerNames[provider] || 'Unknown'
    const colors: Record<number, string> = {
      0: 'bg-green-500',
      1: 'bg-blue-500',
      2: 'bg-yellow-500',
      10: 'bg-purple-500',
      11: 'bg-indigo-500',
      12: 'bg-pink-500',
      13: 'bg-orange-500',
      14: 'bg-teal-500',
      15: 'bg-gray-500',
    }
    return (
      <Badge variant="default" size="sm" className={colors[provider] || 'bg-gray-500'}>
        {name}
      </Badge>
    )
  }

  const columns = [
    {
      key: 'name',
      title: '名称',
      render: (ai: AISupport) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white">
            <CpuChipIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white flex items-center gap-2">
              {ai.name}
              {ai.isPin && <SparklesIcon className="w-4 h-4 text-yellow-500" />}
            </div>
            <div className="text-xs text-surface-500">{ai.modelName}</div>
          </div>
        </div>
      )
    },
    {
      key: 'provider',
      title: '提供商',
      render: (ai: AISupport) => getProviderBadge(ai.provider)
    },
    {
      key: 'status',
      title: '状态',
      render: (ai: AISupport) => (
        ai.isEnabled ? 
          <Badge variant="success" size="sm">启用</Badge> : 
          <Badge variant="default" size="sm">禁用</Badge>
      )
    },
    {
      key: 'config',
      title: '配置',
      render: (ai: AISupport) => (
        <div className="text-sm text-surface-500">
          <div>Max Tokens: {ai.maxTokens}</div>
          <div>Temperature: {ai.temperature}</div>
        </div>
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (ai: AISupport) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(ai)}
            className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="编辑"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(ai)}
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">AI 助手管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理 AI 模型配置和 API 设置
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增 AI 助手
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索 AI 助手名称或模型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button 
            variant="secondary" 
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchAiSupports}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredAiSupports.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的 AI 助手' : '暂无 AI 助手'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个 AI 助手'}
            action={!searchQuery ? { label: '新增 AI 助手', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredAiSupports}
            rowKey="id"
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingAiSupport ? '编辑 AI 助手' : '新增 AI 助手'}
        description={editingAiSupport ? '修改 AI 助手配置' : '创建新的 AI 助手配置'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingAiSupport ? '保存修改' : '创建'}
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
              <label className="form-label">提供商</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {Object.entries(providerNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="API Key"
              placeholder="请输入 API Key"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              error={formErrors.apiKey}
              required
            />
            <Input
              label="Endpoint"
              placeholder="请输入 API Endpoint"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="模型名称"
              placeholder="例如: gpt-4"
              value={formData.modelName}
              onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
            />
            <Input
              label="Max Tokens"
              type="number"
              placeholder="2048"
              value={formData.maxTokens.toString()}
              onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Temperature ({formData.temperature})</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="form-label">Top P ({formData.topP})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.topP}
                onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <Input
              label="排序"
              type="number"
              placeholder="0"
              value={formData.sort.toString()}
              onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
            />
          </div>

          <Input
            label="描述"
            placeholder="请输入描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">启用</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPin}
                onChange={(e) => setFormData({ ...formData, isPin: e.target.checked })}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">置顶</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除"
        description={`确定要删除 AI 助手 "${deletingAiSupport?.name}" 吗？此操作不可恢复。`}
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
