import React, { useState, useEffect } from 'react'
import { Button } from '../../components'
import { documentsApi, projectsApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'

interface Document {
  id: string
  projectId: string
  title: string
  content: string
  parentId?: string
  sort: number
}

interface Project {
  id: string
  name: string
}

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    content: '',
    parentId: '',
    sort: 0,
  })
  const { showToast } = useToast()

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await documentsApi.apiDocumentListGet()
      setDocuments((response.data.data?.items as Document[]) || [])
    } catch (error) {
      showToast('获取文档列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.apiProjectListGet()
      setProjects((response.data.data?.items as Project[]) || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  useEffect(() => {
    fetchDocuments()
    fetchProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingDocument) {
        await documentsApi.apiDocumentUpsertPost({
          documentUpsertRequest: {
            id: editingDocument.id,
            ...formData,
          }
        })
        showToast('文档更新成功', 'success')
      } else {
        await documentsApi.apiDocumentUpsertPost({
          documentUpsertRequest: formData
        })
        showToast('文档创建成功', 'success')
      }
      setShowModal(false)
      setEditingDocument(null)
      setFormData({ projectId: '', title: '', content: '', parentId: '', sort: 0 })
      fetchDocuments()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc)
    setFormData({
      projectId: doc.projectId,
      title: doc.title,
      content: doc.content,
      parentId: doc.parentId || '',
      sort: doc.sort,
    })
    setShowModal(true)
  }

  const handleView = (doc: Document) => {
    setViewingDocument(doc)
    setShowContentModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该文档吗？')) return
    try {
      await documentsApi.apiDocumentDeleteDelete({
        batchDeleteRequest: { ids: [id] }
      })
      showToast('删除成功', 'success')
      fetchDocuments()
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || '未知项目'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文档管理</h1>
        <Button onClick={() => {
          setEditingDocument(null)
          setFormData({ projectId: projects[0]?.id || '', title: '', content: '', parentId: '', sort: 0 })
          setShowModal(true)
        }}>
          新增文档
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">所属项目</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">排序</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{doc.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{getProjectName(doc.projectId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{doc.sort}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleView(doc)} className="text-blue-600 hover:text-blue-900 mr-3">查看</button>
                    <button onClick={() => handleEdit(doc)} className="text-indigo-600 hover:text-indigo-900 mr-3">编辑</button>
                    <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 文档编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingDocument ? '编辑文档' : '新增文档'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所属项目</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  <option value="">请选择项目</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">内容 (Markdown)</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 font-mono"
                  rows={15}
                  placeholder="# 标题&#10;&#10;文档内容..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">排序</label>
                <input
                  type="number"
                  value={formData.sort}
                  onChange={e => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">取消</Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 文档内容查看模态框 */}
      {showContentModal && viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{viewingDocument.title}</h2>
              <button onClick={() => setShowContentModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-100 dark:bg-gray-900 p-4 rounded">
                  {viewingDocument.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
