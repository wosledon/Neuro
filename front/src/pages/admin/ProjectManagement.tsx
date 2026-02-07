import React, { useState, useEffect } from 'react'
import { Button } from '../../components'
import { projectsApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'

interface Project {
  id: string
  name: string
  code: string
  type: number
  description: string
  isEnabled: boolean
  repositoryUrl: string
  homepageUrl: string
}

const projectTypes = [
  { value: 0, label: '文档' },
  { value: 1, label: 'Github' },
  { value: 2, label: 'Gitlab' },
  { value: 3, label: 'Gitee' },
  { value: 4, label: 'Gitea' },
  { value: 99, label: '其他' },
]

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 0,
    description: '',
    isEnabled: true,
    repositoryUrl: '',
    homepageUrl: '',
    docsUrl: '',
  })
  const { showToast } = useToast()

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await projectsApi.apiProjectListGet()
      setProjects((response.data.data?.items as Project[]) || [])
    } catch (error) {
      showToast('获取项目列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProject) {
        await projectsApi.apiProjectUpsertPost({
          projectUpsertRequest: {
            id: editingProject.id,
            ...formData,
          }
        })
        showToast('项目更新成功', 'success')
      } else {
        await projectsApi.apiProjectUpsertPost({
          projectUpsertRequest: formData
        })
        showToast('项目创建成功', 'success')
      }
      setShowModal(false)
      setEditingProject(null)
      setFormData({
        name: '',
        code: '',
        type: 0,
        description: '',
        isEnabled: true,
        repositoryUrl: '',
        homepageUrl: '',
        docsUrl: '',
      })
      fetchProjects()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      code: project.code,
      type: project.type,
      description: project.description,
      isEnabled: project.isEnabled,
      repositoryUrl: project.repositoryUrl || '',
      homepageUrl: project.homepageUrl || '',
      docsUrl: '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该项目吗？')) return
    try {
      await projectsApi.apiProjectDeleteDelete({
        batchDeleteRequest: { ids: [id] }
      })
      showToast('删除成功', 'success')
      fetchProjects()
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  const getTypeLabel = (type: number) => {
    return projectTypes.find(t => t.value === type)?.label || '未知'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">项目管理</h1>
        <Button onClick={() => {
          setEditingProject(null)
          setFormData({
            name: '',
            code: '',
            type: 0,
            description: '',
            isEnabled: true,
            repositoryUrl: '',
            homepageUrl: '',
            docsUrl: '',
          })
          setShowModal(true)
        }}>
          新增项目
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">描述</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {projects.map(project => (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{project.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{getTypeLabel(project.type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">{project.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {project.isEnabled ? <span className="text-green-600">启用</span> : <span className="text-red-600">禁用</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(project)} className="text-indigo-600 hover:text-indigo-900 mr-3">编辑</button>
                    <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-900">删除</button>
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
            <h2 className="text-xl font-bold mb-4">{editingProject ? '编辑项目' : '新增项目'}</h2>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  {projectTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">仓库地址</label>
                <input
                  type="url"
                  value={formData.repositoryUrl}
                  onChange={e => setFormData({ ...formData, repositoryUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">主页地址</label>
                <input
                  type="url"
                  value={formData.homepageUrl}
                  onChange={e => setFormData({ ...formData, homepageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="https://..."
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
    </div>
  )
}
