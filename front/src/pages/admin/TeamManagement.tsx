import React, { useState, useEffect } from 'react'
import { Button } from '../../components'
import { teamsApi, usersApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'

interface Team {
  id: string
  name: string
  code: string
  description: string
  isEnabled: boolean
  parentId?: string
}

interface User {
  id: string
  account: string
  name: string
}

interface Project {
  id: string
  name: string
  code: string
}

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isEnabled: true,
  })
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const { showToast } = useToast()

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const response = await teamsApi.apiTeamListGet()
      setTeams((response.data.data?.items as Team[]) || [])
    } catch (error) {
      showToast('获取团队列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await usersApi.apiUserListGet()
      setAllUsers((response.data.data?.items as User[]) || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  useEffect(() => {
    fetchTeams()
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTeam) {
        await teamsApi.apiTeamUpsertPost({
          teamUpsertRequest: {
            id: editingTeam.id,
            ...formData,
          }
        })
        showToast('团队更新成功', 'success')
      } else {
        await teamsApi.apiTeamUpsertPost({
          teamUpsertRequest: formData
        })
        showToast('团队创建成功', 'success')
      }
      setShowModal(false)
      setEditingTeam(null)
      setFormData({ name: '', code: '', description: '', isEnabled: true })
      fetchTeams()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      code: team.code,
      description: team.description,
      isEnabled: team.isEnabled,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该团队吗？')) return
    try {
      await teamsApi.apiTeamDeleteDelete({
        batchDeleteRequest: { ids: [id] }
      })
      showToast('删除成功', 'success')
      fetchTeams()
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  const openMemberModal = async (team: Team) => {
    setSelectedTeam(team)
    try {
      const response = await teamsApi.apiTeamUsersGet(team.id)
      const members = (response.data.data as User[]) || []
      setTeamMembers(members)
      setSelectedMembers(members.map(m => m.id))
    } catch (error) {
      setTeamMembers([])
      setSelectedMembers([])
    }
    setShowMemberModal(true)
  }

  const saveMembers = async () => {
    if (!selectedTeam) return
    try {
      await teamsApi.apiUserteamAssignPost({
        userTeamAssignRequest: {
          userId: selectedTeam.id, // 注意：这里 API 设计可能需要调整
          teamIds: selectedMembers,
        }
      })
      showToast('成员分配成功', 'success')
      setShowMemberModal(false)
    } catch (error) {
      showToast('成员分配失败', 'error')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">团队管理</h1>
        <Button onClick={() => {
          setEditingTeam(null)
          setFormData({ name: '', code: '', description: '', isEnabled: true })
          setShowModal(true)
        }}>
          新增团队
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">代码</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">描述</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {teams.map(team => (
                <tr key={team.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{team.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{team.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{team.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {team.isEnabled ? <span className="text-green-600">启用</span> : <span className="text-red-600">禁用</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openMemberModal(team)} className="text-blue-600 hover:text-blue-900 mr-3">成员</button>
                    <button onClick={() => handleEdit(team)} className="text-indigo-600 hover:text-indigo-900 mr-3">编辑</button>
                    <button onClick={() => handleDelete(team.id)} className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 团队编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingTeam ? '编辑团队' : '新增团队'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">代码</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isEnabled" className="text-sm text-gray-700 dark:text-gray-300">启用</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">取消</Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 成员管理模态框 */}
      {showMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">管理成员 - {selectedTeam.name}</h2>
            <div className="flex-1 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 mb-4">
              {allUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无用户数据</p>
              ) : (
                <div className="space-y-2">
                  {allUsers.map(user => (
                    <label key={user.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(user.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, user.id])
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== user.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.account}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowMemberModal(false)} type="button">取消</Button>
              <Button onClick={saveMembers}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
