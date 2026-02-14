import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components'
import { teamsApi, usersApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid'

interface Team {
  id: string
  name: string
  code: string
  description?: string
  leaderId?: string
}

interface User {
  id: string
  account: string
  name: string
}

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    leaderId: '',
  })
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const response = await teamsApi.apiTeamListGet()
      const data = (response.data.data as Team[]) || []
      setTeams(data)
      setFilteredTeams(data)
    } catch (error) {
      showToast('获取团队列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await usersApi.apiUserListGet()
      setUsers((response.data.data as User[]) || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  useEffect(() => {
    fetchTeams()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTeams(teams)
      return
    }
    const query = searchQuery.toLowerCase()
    const filtered = teams.filter(team => 
      team.name.toLowerCase().includes(query) ||
      team.code.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query)
    )
    setFilteredTeams(filtered)
  }, [searchQuery, teams])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入团队名称'
    }
    if (!formData.code.trim()) {
      errors.code = '请输入团队编码'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingTeam) {
        await teamsApi.apiTeamUpsertPost({
            id: editingTeam.id,
            ...formData,
          })
        await teamsApi.apiTeamAssignUsersAssignUsersPost({
          teamId: editingTeam.id,
          userIds: selectedMembers,
        })
        showToast('团队更新成功', 'success')
      } else {
        const response = await teamsApi.apiTeamUpsertPost(formData)
        const newTeamId = (response.data.data as any)?.id
        if (newTeamId && selectedMembers.length > 0) {
          await teamsApi.apiTeamAssignUsersAssignUsersPost({
            teamId: newTeamId,
            userIds: selectedMembers,
          })
        }
        showToast('团队创建成功', 'success')
      }
      closeModal()
      fetchTeams()
    } catch (error: any) {
      console.error('Team operation failed:', error)
      showToast(error.response?.data?.message || '操作失败', 'error')
    }
  }

  const handleEdit = async (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      code: team.code,
      description: team.description || '',
      leaderId: team.leaderId || '',
    })
    try {
      const response = await teamsApi.apiTeamGetTeamUsersIdUsersGet(team.id)
      const teamUsers = (response.data.data as any[]) || []
      setSelectedMembers(teamUsers.map(u => u.id))
    } catch (error) {
      setSelectedMembers([])
    }
    setShowModal(true)
  }

  const handleDelete = (team: Team) => {
    setDeletingTeam(team)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingTeam) return
    try {
      await teamsApi.apiTeamDeleteDelete({ ids: [deletingTeam.id] })
      showToast('删除成功', 'success')
      fetchTeams()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingTeam(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTeam(null)
    setFormData({ name: '', code: '', description: '', leaderId: '' })
    setSelectedMembers([])
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingTeam(null)
    setFormData({ name: '', code: '', description: '', leaderId: '' })
    setSelectedMembers([])
    setFormErrors({})
    setShowModal(true)
  }

  const getLeaderName = (leaderId?: string) => {
    if (!leaderId) return '-'
    const leader = users.find(u => u.id === leaderId)
    return leader ? (leader.name || leader.account) : '-'
  }

  const columns = [
    {
      key: 'name',
      title: '团队名称',
      render: (team: Team) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
            <UserGroupIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{team.name}</div>
            <div className="text-xs text-surface-500">{team.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'description',
      title: '描述',
      render: (team: Team) => (
        <span className="text-surface-600 dark:text-surface-400">
          {team.description || '-'}
        </span>
      )
    },
    {
      key: 'leader',
      title: '负责人',
      render: (team: Team) => (
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-surface-400" />
          <span className="text-surface-600 dark:text-surface-400">
            {getLeaderName(team.leaderId)}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (team: Team) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(team)}
            className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="编辑"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(team)}
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">团队管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理团队及其成员
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增团队
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索团队名称或编码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button 
            variant="secondary" 
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchTeams}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : filteredTeams.length === 0 ? (
          <EmptyState
            title={searchQuery ? '未找到匹配的团队' : '暂无团队'}
            description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个团队'}
            action={!searchQuery ? { label: '新增团队', onClick: openCreateModal } : undefined}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTeams}
            rowKey="id"
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTeam ? '编辑团队' : '新增团队'}
        description={editingTeam ? '修改团队信息和成员' : '创建新团队并分配成员'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingTeam ? '保存修改' : '创建团队'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="团队名称"
              placeholder="请输入团队名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="团队编码"
              placeholder="请输入团队编码"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={formErrors.code}
              required
            />
          </div>

          <div>
            <label className="form-label">负责人</label>
            <select
              value={formData.leaderId}
              onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">请选择负责人</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || user.account}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="描述"
            placeholder="请输入团队描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div>
            <label className="form-label">团队成员</label>
            <div className="border border-surface-300 dark:border-surface-600 rounded-xl p-4 max-h-64 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">暂无可用用户</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, user.id])
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== user.id))
                          }
                        }}
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-medium">
                          {user.name?.[0] || user.account[0]}
                        </div>
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {user.name || user.account}
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
        description={`确定要删除团队 "${deletingTeam?.name}" 吗？此操作不可恢复。`}
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
