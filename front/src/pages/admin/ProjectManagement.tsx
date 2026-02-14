import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components'
import { projectsApi, teamsApi, teamProjectApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FolderIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CalendarIcon
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
  status: mapStatusToString(detail.status)
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
  })
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

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

  useEffect(() => {
    fetchProjects()
    fetchTeams()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects)
      return
    }
    const query = searchQuery.toLowerCase()
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.code.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    )
    setFilteredProjects(filtered)
  }, [searchQuery, projects])

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
        await projectsApi.apiProjectUpsertPost({
          id: editingProject.id,
          name: formData.name,
          code: formData.code,
          description: formData.description,
          status: statusNumber,
        })
        
        // 分配团队
        await assignProjectToTeams(editingProject.id, selectedTeams)
        
        showToast('项目更新成功', 'success')
      } else {
        const response = await projectsApi.apiProjectUpsertPost({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          status: statusNumber,
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
    setFormData({ name: '', code: '', description: '', status: 'active' })
    setSelectedTeams([])
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingProject(null)
    setFormData({ name: '', code: '', description: '', status: 'active' })
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
          <button
            onClick={() => handleEdit(project)}
            className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="编辑"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(project)}
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
      <Card>
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
