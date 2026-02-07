import React, { useState, useEffect } from 'react'
import { Button } from '../../components'
import { usersApi, rolesApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'

interface User {
  id: string
  account: string
  name: string
  email: string
  phone: string
  isSuper: boolean
}

interface Role {
  id: string
  name: string
  code: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    account: '',
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const { showToast } = useToast()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await usersApi.apiUserListGet()
      setUsers((response.data.data?.items as User[]) || [])
    } catch (error) {
      showToast('获取用户列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.apiRoleListGet()
      setRoles((response.data.data?.items as Role[]) || [])
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await usersApi.apiUserUpsertPost({
          userUpsertRequest: {
            id: editingUser.id,
            ...formData,
          }
        })
        // 更新角色关联
        await usersApi.apiUserroleAssignPost({
          userRoleAssignRequest: {
            userId: editingUser.id,
            roleIds: selectedRoles,
          }
        })
        showToast('用户更新成功', 'success')
      } else {
        const response = await usersApi.apiUserUpsertPost({
          userUpsertRequest: formData
        })
        const newUserId = (response.data.data as any)?.id
        if (newUserId && selectedRoles.length > 0) {
          await usersApi.apiUserroleAssignPost({
            userRoleAssignRequest: {
              userId: newUserId,
              roleIds: selectedRoles,
            }
          })
        }
        showToast('用户创建成功', 'success')
      }
      setShowModal(false)
      setEditingUser(null)
      setFormData({ account: '', name: '', email: '', phone: '', password: '' })
      setSelectedRoles([])
      fetchUsers()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = async (user: User) => {
    setEditingUser(user)
    setFormData({
      account: user.account,
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '',
    })
    // 获取用户当前角色
    try {
      const response = await usersApi.apiUserRolesGet(user.id)
      const userRoles = (response.data.data as any[]) || []
      setSelectedRoles(userRoles.map(r => r.id))
    } catch (error) {
      setSelectedRoles([])
    }
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该用户吗？')) return
    try {
      await usersApi.apiUserDeleteDelete({
        batchDeleteRequest: { ids: [id] }
      })
      showToast('删除成功', 'success')
      fetchUsers()
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Button onClick={() => {
          setEditingUser(null)
          setFormData({ account: '', name: '', email: '', phone: '', password: '' })
          setSelectedRoles([])
          setShowModal(true)
        }}>
          新增用户
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">账号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">邮箱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">电话</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">超级管理员</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.account}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {user.isSuper ? <span className="text-green-600">是</span> : <span className="text-gray-400">否</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 mr-3">编辑</button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingUser ? '编辑用户' : '新增用户'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">账号</label>
                <input
                  type="text"
                  required
                  value={formData.account}
                  onChange={e => setFormData({ ...formData, account: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">电话</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  密码 {editingUser && '(留空表示不修改)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">角色</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3">
                  {roles.map(role => (
                    <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedRoles([...selectedRoles, role.id])
                          } else {
                            setSelectedRoles(selectedRoles.filter(id => id !== role.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{role.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">取消</Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
