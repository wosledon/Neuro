import React, { useState, useEffect, useCallback } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner, Select, Tooltip } from '../../components'
import { projectsApi, teamsApi, teamProjectApi, gitCredentialApi, aiSupportApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { useRouter } from '../../router'
import { useProjectDocSignalR, DocGenProgress } from '../../hooks/useProjectDocSignalR'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FolderIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CalendarIcon,
  KeyIcon,
  CpuChipIcon,
  CodeBracketIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid'

// 后端返回的项目数据
interface ProjectDetail {
  id: string
  name: string
  code: string
  description?: string
  isEnabled: boolean
  status: number  // 0=active, 1=inactive, 2=archived
  isPin?: boolean
  type?: number
  parentId?: string
  treePath?: string
  repositoryUrl?: string
  homepageUrl?: string
  docsUrl?: string
  sort?: number
  gitCredentialId?: string
  gitCredentialName?: string
  aiSupportId?: string
  aiSupportName?: string
  enableAIDocs?: boolean
}

// 前端使用的项目数据
interface Project {
  id: string
  name: string
  code: string
  description?: string
  isEnabled: boolean
  status: 'active' | 'inactive' | 'archived'
  startDate?: string
  endDate?: string
  repositoryUrl?: string
  gitCredentialId?: string
  gitCredentialName?: string
  aiSupportId?: string
  aiSupportName?: string
  enableAIDocs?: boolean
  docGenStatus?: number  // 0=Pending, 1=Pulling, 2=Generating, 3=Completed, 4=Failed
  lastDocGenAt?: string
}

interface GitCredential {
  id: string
  name: string
  type: number
}

interface AISupport {
  id: string
  name: string
  modelName?: string
}

interface Team {
  id: string
  name: string
}

interface TeamProjectDetail {
  id: string
  teamId: string
  teamName: string
  projectId: string
  projectName: string
}

// 将后端 status (number) 映射为前端 status (string)
const mapStatusToString = (status: number): 'active' | 'inactive' | 'archived' => {
  switch (status) {
    case 0: return 'active'
    case 1: return 'inactive'
    case 2: return 'archived'
    default: return 'active'
  }
}

// 将前端 status (string) 映射为后端 status (number)
const mapStatusToNumber = (status: 'active' | 'inactive' | 'archived'): number => {
  switch (status) {
    case 'active': return 0
    case 'inactive': return 1
    case 'archived': return 2
    default: return 0
  }
}

// 将后端 ProjectDetail 映射为前端 Project
const mapProjectDetailToProject = (detail: ProjectDetail): Project => ({
  id: detail.id,
  name: detail.name,
  code: detail.code,
  description: detail.description,
  isEnabled: detail.isEnabled,
  status: mapStatusToString(detail.status),
  repositoryUrl: detail.repositoryUrl,
  gitCredentialId: detail.gitCredentialId,
  gitCredentialName: detail.gitCredentialName,
  aiSupportId: detail.aiSupportId,
  aiSupportName: detail.aiSupportName,
  enableAIDocs: detail.enableAIDocs
})

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
    repositoryUrl: '',
    gitCredentialId: '',
    aiSupportId: '',
    enableAIDocs: false,
  })
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [gitCredentials, setGitCredentials] = useState<GitCredential[]>([])
  const [aiSupports, setAiSupports] = useState<AISupport[]>([])
  const [docGenProgress, setDocGenProgress] = useState<Record<string, DocGenProgress>>({})
  const { show: showToast } = useToast()
  const { navigate } = useRouter()

  // SignalR 文档生成进度
  const handleDocGenProgress = useCallback((progress: DocGenProgress) => {
    setDocGenProgress(prev => ({
      ...prev,
      [progress.projectId]: progress
    }))
    
    // 如果完成了，刷新项目列表以获取最新状态
    if (progress.status === 3 || progress.status === 4) {
      setTimeout(() => fetchProjects(), 1000)
    }
  }, [])

  const { isConnected: docHubConnected, subscribeProject, unsubscribeProject } = useProjectDocSignalR({
    onProgress: handleDocGenProgress
  })

  // 订阅所有项目的文档生成进度
  useEffect(() => {
    if (docHubConnected) {
      projects.forEach(project => {
        subscribeProject(project.id)
      })
    }
    
    return () => {
      projects.forEach(project => {
        unsubscribeProject(project.id)
      })
    }
  }, [docHubConnected, projects])

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await projectsApi.apiProjectListGet()
      const data = ((response.data.data as ProjectDetail[]) || []).map(mapProjectDetailToProject)
      setProjects(data)
      setFilteredProjects(data)
    } catch (error) {
      showToast('获取项目列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await teamsApi.apiTeamListGet()
      setTeams((response.data.data as Team[]) || [])
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    }
  }

  const fetchGitCredentials = async () => {
    try {
      const response = await gitCredentialApi.apiGitCredentialListGet()
      setGitCredentials((response.data.data as GitCredential[]) || [])
    } catch (error) {
      console.error('Failed to fetch git credentials:', error)
    }
  }

  const fetchAiSupports = async () => {
    try {
      const response = await aiSupportApi.apiAISupportListGet()
      setAiSupports((response.data.data as AISupport[]) || [])
    } catch (error) {
      console.error('Failed to fetch AI supports:', error)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchTeams()
    fetchGitCredentials()
    fetchAiSupports()
  }, [])

  // Filter projects based on search query and pagination
  useEffect(() => {
    let filtered = projects
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = projects.filter(project => 
        project.name.toLowerCase().includes(query) ||
        project.code.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
      )
    }
    
    setPagination(prev => ({ ...prev, total: filtered.length }))
    
    // 客户端分页
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    setFilteredProjects(filtered.slice(start, end))
  }, [searchQuery, projects, pagination.current, pagination.pageSize])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入项目名称'
    }
    if (!formData.code.trim()) {
      errors.code = '请输入项目编码'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 获取项目当前关联的团队ID列表
  const fetchProjectTeams = async (projectId: string): Promise<string[]> => {
    try {
      const response = await teamProjectApi.apiTeamProjectListGet(undefined, projectId)
      const teamProjects = (response.data.data as TeamProjectDetail[]) || []
      return teamProjects.map(tp => tp.teamId)
    } catch (error) {
      console.error('Failed to fetch project teams:', error)
      return []
    }
  }

  // 为项目分配团队（需要为每个团队调用API）
  const assignProjectToTeams = async (projectId: string, teamIds: string[]) => {
    // 获取当前所有团队与项目的关联
    const currentAssignments = await teamProjectApi.apiTeamProjectListGet(undefined, projectId)
    const currentTeamProjects = (currentAssignments.data.data as TeamProjectDetail[]) || []
    
    // 找出当前已关联的团队ID
    const currentTeamIds = currentTeamProjects.map(tp => tp.teamId)
    
    // 需要添加的团队（新选中但当前未关联）
    const toAdd = teamIds.filter(id => !currentTeamIds.includes(id))
    // 需要移除的团队（当前关联但未被选中）
    const toRemove = currentTeamProjects.filter(tp => !teamIds.includes(tp.teamId))
    
    // 为新团队添加项目关联
    for (const teamId of toAdd) {
      // 先获取该团队当前的所有项目
      const teamProjectsResponse = await teamProjectApi.apiTeamProjectListGet(teamId)
      const existingProjects = (teamProjectsResponse.data.data as TeamProjectDetail[]) || []
      const existingProjectIds = existingProjects.map(tp => tp.projectId)
      
      // 添加新项目到该团队
      await teamProjectApi.apiTeamProjectAssignPost({
        teamId: teamId,
        projectIds: [...existingProjectIds, projectId]
      })
    }
    
    // 移除不再关联的团队
    for (const tp of toRemove) {
      if (tp.id) {
        await teamProjectApi.apiTeamProjectDeleteDelete({ ids: [tp.id] })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      // 将前端 status 映射为后端 status (number)
      const statusNumber = mapStatusToNumber(formData.status)
      
      if (editingProject) {
        // 根据是否有仓库地址判断项目类型：1=Github, 2=Gitlab, 3=Gitee, 4=Gitea, 0=Document(文档)
        // 有仓库地址默认使用 Github(1)，没有则为文档(0)
        const projectType = formData.repositoryUrl ? 1 : 0
        
        await projectsApi.apiProjectUpsertPost({
          id: editingProject.id,
          name: formData.name,
          code: formData.code,
          description: formData.description,
          status: statusNumber,
          type: projectType,
          repositoryUrl: formData.repositoryUrl,
          gitCredentialId: formData.gitCredentialId || undefined,
          aiSupportId: formData.aiSupportId || undefined,
          enableAIDocs: formData.enableAIDocs,
        })
        
        // 分配团队
        await assignProjectToTeams(editingProject.id, selectedTeams)
        
        showToast('项目更新成功', 'success')
      } else {
        // 根据是否有仓库地址判断项目类型：1=Github, 2=Gitlab, 3=Gitee, 4=Gitea, 0=Document(文档)
        // 有仓库地址默认使用 Github(1)，没有则为文档(0)
        const projectType = formData.repositoryUrl ? 1 : 0
        
        const response = await projectsApi.apiProjectUpsertPost({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          status: statusNumber,
          type: projectType,
          repositoryUrl: formData.repositoryUrl,
          gitCredentialId: formData.gitCredentialId || undefined,
          aiSupportId: formData.aiSupportId || undefined,
          enableAIDocs: formData.enableAIDocs,
        })
        const newProjectId = (response.data.data as any)?.id
        if (newProjectId && selectedTeams.length > 0) {
          await assignProjectToTeams(newProjectId, selectedTeams)
        }
        showToast('项目创建成功', 'success')
      }
      closeModal()
      fetchProjects()
    } catch (error) {
      console.error('Submit error:', error)
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = async (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      code: project.code,
      description: project.description || '',
      status: project.status,
      repositoryUrl: project.repositoryUrl || '',
      gitCredentialId: project.gitCredentialId || '',
      aiSupportId: project.aiSupportId || '',
      enableAIDocs: project.enableAIDocs || false,
    })
    
    // 获取项目当前关联的团队
    const teamIds = await fetchProjectTeams(project.id)
    setSelectedTeams(teamIds)
    
    setShowModal(true)
  }

  const handleDelete = (project: Project) => {
    setDeletingProject(project)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingProject) return
    try {
      await projectsApi.apiProjectDeleteDelete({ ids: [deletingProject.id] })
      showToast('删除成功', 'success')
      fetchProjects()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingProject(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProject(null)
    setFormData({ 
      name: '', 
      code: '', 
      description: '', 
      status: 'active',
      repositoryUrl: '',
      gitCredentialId: '',
      aiSupportId: '',
      enableAIDocs: false,
    })
    setSelectedTeams([])
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingProject(null)
    setFormData({ 
      name: '', 
      code: '', 
      description: '', 
      status: 'active',
      repositoryUrl: '',
      gitCredentialId: '',
      aiSupportId: '',
      enableAIDocs: false,
    })
    setSelectedTeams([])
    setFormErrors({})
    setShowModal(true)
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">进行中</Badge>
      case 'inactive':
        return <Badge variant="warning" size="sm">暂停</Badge>
      case 'archived':
        return <Badge variant="default" size="sm">已归档</Badge>
      default:
        return <Badge variant="default" size="sm">未知</Badge>
    }
  }

  // 获取文档生成状态显示
  const getDocGenStatusDisplay = (project: Project) => {
    const progress = docGenProgress[project.id]
    
    // 优先使用实时进度
    if (progress) {
      const statusColors: Record<number, string> = {
        0: 'bg-surface-400', // Pending
        1: 'bg-blue-500',    // Pulling
        2: 'bg-yellow-500',  // Generating
        3: 'bg-green-500',   // Completed
        4: 'bg-red-500'      // Failed
      }
      
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-[100px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-surface-600 dark:text-surface-400">{progress.statusText}</span>
              <span className="text-surface-500">{progress.progress}%</span>
            </div>
            <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${statusColors[progress.status] || 'bg-surface-400'}`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        </div>
      )
    }
    
    // 使用项目状态
    const statusMap: Record<number, { text: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
      0: { text: '待处理', variant: 'default' },
      1: { text: '拉取中', variant: 'warning' },
      2: { text: '生成中', variant: 'warning' },
      3: { text: '已完成', variant: 'success' },
      4: { text: '失败', variant: 'danger' }
    }
    
    const status = project.docGenStatus ?? 0
    const { text, variant } = statusMap[status] || { text: '待处理', variant: 'default' }
    
    return <Badge variant={variant} size="sm">{text}</Badge>
  }

  // 触发文档生成
  const triggerDocGeneration = async (project: Project) => {
    try {
      // 调用后端 API 触发文档生成
      await projectsApi.apiProjectGenerateDocsGenerateDocsPost(project.id)
      showToast('文档生成已触发', 'success')
    } catch (error) {
      showToast('触发文档生成失败', 'error')
    }
  }

  const columns = [
    {
      key: 'name',
      title: '项目名称',
      render: (project: Project) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">
            <FolderIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{project.name}</div>
            <div className="text-xs text-surface-500">{project.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'description',
      title: '描述',
      render: (project: Project) => (
        <span className="text-surface-600 dark:text-surface-400 truncate max-w-xs block">
          {project.description || '-'}
        </span>
      )
    },
    {
      key: 'docGenStatus',
      title: '文档生成',
      render: (project: Project) => getDocGenStatusDisplay(project)
    },
    {
      key: 'status',
      title: '状态',
      render: (project: Project) => getStatusBadge(project.status)
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (project: Project) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip content="生成文档" placement="top">
            <button
              onClick={() => triggerDocGeneration(project)}
              disabled={docGenProgress[project.id]?.status === 1 || docGenProgress[project.id]?.status === 2}
              className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentTextIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="编辑" placement="top">
            <button
              onClick={() => handleEdit(project)}
              className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="删除" placement="top">
            <button
              onClick={() => handleDelete(project)}
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">项目管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理项目信息及关联团队
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增项目
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索项目名称或编码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button 
            variant="secondary" 
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchProjects}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的项目' : '暂无项目'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个项目'}
            action={!searchQuery ? { label: '新增项目', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredProjects}
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
        title={editingProject ? '编辑项目' : '新增项目'}
        description={editingProject ? '修改项目信息和关联团队' : '创建新项目并分配团队'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingProject ? '保存修改' : '创建项目'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="项目名称"
              placeholder="请输入项目名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="项目编码"
              placeholder="请输入项目编码"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={formErrors.code}
              required
            />
          </div>

          <div>
            <label className="form-label">项目状态</label>
            <div className="flex gap-4">
              {[
                { value: 'active', label: '进行中', color: 'green' },
                { value: 'inactive', label: '暂停', color: 'yellow' },
                { value: 'archived', label: '已归档', color: 'gray' },
              ].map((status) => (
                <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={formData.status === status.value}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-4 h-4 text-primary-600 border-surface-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-surface-700 dark:text-surface-300">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Input
            label="描述"
            placeholder="请输入项目描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {/* Git 集成配置 */}
          <div className="border border-surface-200 dark:border-surface-700 rounded-xl p-4 space-y-4 bg-surface-50/50 dark:bg-surface-800/30">
            <div className="flex items-center gap-2 text-surface-900 dark:text-white font-medium">
              <CodeBracketIcon className="w-5 h-5 text-primary-500" />
              <span>Git 集成配置</span>
            </div>
            
            <Input
              label="Git 仓库地址"
              placeholder="https://github.com/username/repo.git"
              value={formData.repositoryUrl}
              onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
            />

            <div>
              <Select
                label="Git 凭据"
                value={formData.gitCredentialId}
                onChange={(value) => setFormData({ ...formData, gitCredentialId: value })}
                options={[{ value: '', label: '-- 选择 Git 凭据 --' }, ...gitCredentials.map(cred => ({
                  value: cred.id,
                  label: `${cred.name} (${cred.type === 0 ? '密码' : cred.type === 1 ? 'SSH 密钥' : 'PAT'})`
                }))]}
              />
              {gitCredentials.length === 0 && (
                <p className="text-xs text-surface-500 mt-1">
                  暂无可用凭据，请先前往 <a href="#" onClick={() => navigate('git-credentials')} className="text-primary-600 hover:underline">Git 凭据管理</a> 创建
                </p>
              )}
            </div>
          </div>

          {/* AI 文档生成配置 */}
          <div className="border border-surface-200 dark:border-surface-700 rounded-xl p-4 space-y-4 bg-surface-50/50 dark:bg-surface-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-surface-900 dark:text-white font-medium">
                <CpuChipIcon className="w-5 h-5 text-accent-500" />
                <span>AI 文档生成</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableAIDocs}
                  onChange={(e) => setFormData({ ...formData, enableAIDocs: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">启用 AI 文档生成</span>
              </label>
            </div>

            {formData.enableAIDocs && (
              <div>
                <Select
                  label="AI 模型"
                  value={formData.aiSupportId}
                  onChange={(value) => setFormData({ ...formData, aiSupportId: value })}
                  options={[{ value: '', label: '-- 选择 AI 模型 --' }, ...aiSupports.map(ai => ({
                    value: ai.id,
                    label: `${ai.name} ${ai.modelName ? `(${ai.modelName})` : ''}`
                  }))]}
                />
                {aiSupports.length === 0 && (
                  <p className="text-xs text-surface-500 mt-1">
                    暂无可用模型，请先前往 <a href="#" onClick={() => navigate('ai-supports')} className="text-primary-600 hover:underline">AI 助手管理</a> 创建
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="form-label">关联团队</label>
            <div className="border border-surface-300 dark:border-surface-600 rounded-xl p-4 max-h-64 overflow-y-auto">
              {teams.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">暂无可用团队</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {teams.map(team => (
                    <label key={team.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeams([...selectedTeams, team.id])
                          } else {
                            setSelectedTeams(selectedTeams.filter(id => id !== team.id))
                          }
                        }}
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4 text-surface-400" />
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {team.name}
                        </span>
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
        description={`确定要删除项目 "${deletingProject?.name}" 吗？此操作不可恢复。`}
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
