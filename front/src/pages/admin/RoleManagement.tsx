import React, { useState, useEffect } from 'react'
import { Button } from '../../components'
import { rolesApi, permissionsApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'

interface Role {
  id: string
  name: string
  code: string
  description: string
  isEnabled: boolean
  isPin: boolean
  parentId?: string
}

interface Permission {
  id: string
  name: string
  code: string
  description: string
}

interface Menu {
  id: string
  name: string
  code: string
  url: string
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isEnabled: true,
  })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [selectedMenus, setSelectedMenus] = useState<string[]>([])
  const { showToast } = useToast()

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const response = await rolesApi.apiRoleListGet()
      setRoles((response.data.data?.items as Role[]) || [])
    } catch (error) {
      showToast('获取角色列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await permissionsApi.apiPermissionListGet()
      setPermissions((response.data.data?.items as Permission[]) || [])
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    }
  }

  const fetchMenus = async () => {
    try {
      // 使用菜单 API 或从其他方式获取
      // 这里简化处理
      setMenus([])
    } catch (error) {
      console.error('Failed to fetch menus:', error)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
    fetchMenus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRole) {
        await rolesApi.apiRoleUpsertPost({
          roleUpsertRequest: {
            id: editingRole.id,
            ...formData,
          }
        })
        showToast('角色更新成功', 'success')
      } else {
        await rolesApi.apiRoleUpsertPost({
          roleUpsertRequest: formData
        })
        showToast('角色创建成功', 'success')
      }
      setShowModal(false)
      setEditingRole(null)
      setFormData({ name: '', code: '', description: '', isEnabled: true })
      fetchRoles()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description,
      isEnabled: role.isEnabled,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该角色吗？')) return
    try {
      await rolesApi.apiRoleDeleteDelete({
        batchDeleteRequest: { ids: [id] }
      })
      showToast('删除成功', 'success')
      fetchRoles()
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  const openPermissionModal = async (role: Role) => {
    setSelectedRole(role)
    try {
      const response = await rolesApi.apiRolePermissionsGet(role.id)
      const rolePermissions = (response.data.data as any[]) || []
      setSelectedPermissions(rolePermissions.map(p => p.id))
    } catch (error) {
      setSelectedPermissions([])
    }
    setShowPermissionModal(true)
  }

  const savePermissions = async () => {
    if (!selectedRole) return
    try {
      await rolesApi.apiRolepermissionAssignPost({
        rolePermissionAssignRequest: {
          roleId: selectedRole.id,
          permissionIds: selectedPermissions,
        }
      })
      showToast('权限分配成功', 'success')
      setShowPermissionModal(false)
    } catch (error) {
      showToast('权限分配失败', 'error')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">角色管理</h1>
        <Button onClick={() => {
          setEditingRole(null)
          setFormData({ name: '', code: '', description: '', isEnabled: true })
          setShowModal(true)
        }}>
          新增角色
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
              {roles.map(role => (
                <tr key={role.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{role.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{role.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{role.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {role.isEnabled ? <span className="text-green-600">启用</span> : <span className="text-red-600">禁用</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openPermissionModal(role)} className="text-blue-600 hover:text-blue-900 mr-3">权限</button>
                    <button onClick={() => handleEdit(role)} className="text-indigo-600 hover:text-indigo-900 mr-3">编辑</button>
                    <button onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 角色编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingRole ? '编辑角色' : '新增角色'}</h2>
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

      {/* 权限分配模态框 */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">分配权限 - {selectedRole.name}</h2>
            <div className="flex-1 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 mb-4">
              {permissions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无权限数据</p>
              ) : (
                <div className="space-y-2">
                  {permissions.map(permission => (
                    <label key={permission.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id])
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{permission.name}</div>
                        <div className="text-xs text-gray-500">{permission.code}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowPermissionModal(false)} type="button">取消</Button>
              <Button onClick={savePermissions}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
