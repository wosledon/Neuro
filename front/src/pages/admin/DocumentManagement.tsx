import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Button, Card, Input, Modal, Table, Badge, EmptyState, LoadingSpinner, Select, Tooltip } from '../../components'
import { documentsApi, projectsApi, documentAttachmentsApi } from '../../services/auth'
import { useToast } from '../../components/ToastProvider'
import MarkdownIt from 'markdown-it'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CodeBracketIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  FolderArrowDownIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Bars3Icon,
  PaperClipIcon,
  PhotoIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  LinkIcon,
  ClipboardIcon,
  CheckIcon,
  CloudArrowUpIcon,
  FolderOpenIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BarsArrowUpIcon,
  BarsArrowDownIcon
} from '@heroicons/react/24/solid'

// 初始化 Markdown 解析器
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
  highlight: function (str, lang) {
    const escaped = mdParser.utils.escapeHtml(str)
    return `<pre class="bg-surface-100 dark:bg-surface-900 text-surface-800 dark:text-surface-100 p-4 rounded-lg overflow-x-auto border border-surface-200 dark:border-surface-700"><code>${escaped}</code></pre>`
  }
})

interface Document {
  id: string
  projectId: string
  title: string
  content: string
  parentId?: string
  treePath: string
  sort: number
  createdAt?: string
  updatedAt?: string
  hasChildren?: boolean
  children?: Document[]
}

interface Project {
  id: string
  name: string
}

// 以项目为主节点的文档树节点
interface ProjectDocumentNode {
  id: string
  name: string
  code: string
  description: string
  documents: Document[]
}

interface DocumentAttachment {
  id: string
  documentId: string
  fileName: string
  storageKey: string
  fileSize: number
  mimeType?: string
  isInline: boolean
  sort: number
  createdAt: string
}

type ViewMode = 'list' | 'tree' | 'split'
type EditMode = 'split' | 'edit' | 'preview'
type FileViewMode = 'grid' | 'list'

// 文件大小格式化
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件图标
const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return <DocumentTextIcon className="w-8 h-8 text-surface-400" />
  if (mimeType.startsWith('image/')) return <PhotoIcon className="w-8 h-8 text-purple-500" />
  if (mimeType.startsWith('video/')) return <DocumentTextIcon className="w-8 h-8 text-red-500" />
  if (mimeType.startsWith('audio/')) return <DocumentTextIcon className="w-8 h-8 text-amber-500" />
  if (mimeType.includes('pdf')) return <DocumentTextIcon className="w-8 h-8 text-red-600" />
  if (mimeType.includes('word') || mimeType.includes('document')) return <DocumentTextIcon className="w-8 h-8 text-blue-600" />
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return <DocumentTextIcon className="w-8 h-8 text-green-600" />
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <DocumentTextIcon className="w-8 h-8 text-orange-600" />
  if (mimeType.includes('code') || mimeType.includes('json') || mimeType.includes('xml')) return <CodeBracketIcon className="w-8 h-8 text-cyan-600" />
  return <DocumentTextIcon className="w-8 h-8 text-surface-400" />
}

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectDocTree, setProjectDocTree] = useState<ProjectDocumentNode[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [editMode, setEditMode] = useState<EditMode>('split')
  const [fileViewMode, setFileViewMode] = useState<FileViewMode>('grid')
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [selectedProject, setSelectedProject] = useState<string>('')
  
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  
  // Modals
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showFileModal, setShowFileModal] = useState(false)
  
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null)
  const [movingDoc, setMovingDoc] = useState<Document | null>(null)
  const [targetParentId, setTargetParentId] = useState<string>('')
  
  // 附件相关
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    content: '',
    parentId: '',
    sort: 0,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { show: showToast } = useToast()
  
  // Refs
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isSyncing = useRef(false)

  // 获取以项目为主节点的文档树
  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await documentsApi.apiDocumentGetTreeByProjectsTreeByProjectsGet()
      const data = (response.data.data as ProjectDocumentNode[]) || []
      setProjectDocTree(data)
      
      // 同时更新 projects 列表（用于下拉选择等）
      const projectList = data.map(p => ({ id: p.id, name: p.name }))
      setProjects(projectList)
      
      // 默认展开所有项目
      setExpandedProjects(new Set(projectList.map(p => p.id)))
      
      // 扁平化所有文档用于列表视图
      const allDocs: Document[] = []
      data.forEach(project => {
        allDocs.push(...flattenDocuments(project.documents))
      })
      setDocuments(allDocs)
      setFilteredDocuments(allDocs)
    } catch (error) {
      showToast('获取文档列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }
  
  // 按需加载子节点
  const fetchChildren = async (parentId: string) => {
    try {
      const response = await documentsApi.apiDocumentGetChildrenChildrenGet(parentId)
      const children = (response.data.data as Document[]) || []
      
      // 递归更新项目文档树，将子节点添加到对应的父节点
      const updateProjectTreeWithChildren = (projects: ProjectDocumentNode[]): ProjectDocumentNode[] => {
        return projects.map(project => ({
          ...project,
          documents: updateDocTreeWithChildren(project.documents)
        }))
      }
      
      const updateDocTreeWithChildren = (nodes: Document[]): Document[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return { ...node, children }
          }
          if (node.children) {
            return { ...node, children: updateDocTreeWithChildren(node.children) }
          }
          return node
        })
      }
      
      setProjectDocTree(prev => updateProjectTreeWithChildren(prev))
      
      // 同时更新扁平化的文档列表
      setDocuments(prev => {
        const updated = updateDocTreeWithChildren(prev)
        return flattenDocuments(updated)
      })
      setFilteredDocuments(prev => {
        const updated = updateDocTreeWithChildren(prev)
        return flattenDocuments(updated)
      })
      
      return children
    } catch (error) {
      showToast('加载子文档失败', 'error')
      return []
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.apiProjectListGet()
      setProjects((response.data.data as Project[]) || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  // 获取文档附件
  const fetchAttachments = async (documentId: string) => {
    try {
      const response = await documentAttachmentsApi.apiDocumentAttachmentListGet(documentId)
      setAttachments((response.data.data as DocumentAttachment[]) || [])
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  // 搜索过滤 - 始终返回扁平数组供列表视图使用
  useEffect(() => {
    let filtered = flattenDocuments(documents)
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query)
      )
    }
    
    setPagination(prev => ({ ...prev, total: filtered.length }))
    
    // 客户端分页
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    setFilteredDocuments(filtered.slice(start, end))
  }, [searchQuery, documents, pagination.current, pagination.pageSize])

  // 扁平化文档树
  const flattenDocuments = (docs: Document[]): Document[] => {
    const result: Document[] = []
    const traverse = (nodes: Document[]) => {
      nodes.forEach(node => {
        result.push(node)
        if (node.children) traverse(node.children)
      })
    }
    traverse(docs)
    return result
  }

  // 重建树结构
  const rebuildTree = (flatDocs: Document[]): Document[] => {
    const nodeMap = new Map<string, Document>(flatDocs.map(d => [d.id, { ...d, children: [] as Document[] }]))
    const roots: Document[] = []
    
    flatDocs.forEach(doc => {
      const node = nodeMap.get(doc.id)!
      if (doc.parentId && nodeMap.has(doc.parentId)) {
        const parent = nodeMap.get(doc.parentId)!
        parent.children = parent.children || []
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })
    
    return roots
  }

  // 同步滚动
  const handleEditorScroll = () => {
    if (isSyncing.current || !textareaRef.current || !previewRef.current) return
    
    isSyncing.current = true
    
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
    
    const editor = textareaRef.current
    const preview = previewRef.current
    
    const editorScrollable = editor.scrollHeight - editor.clientHeight
    const previewScrollable = preview.scrollHeight - preview.clientHeight
    
    if (editorScrollable > 0 && previewScrollable > 0) {
      const scrollPercent = editor.scrollTop / editorScrollable
      preview.scrollTop = scrollPercent * previewScrollable
    }
    
    setTimeout(() => { isSyncing.current = false }, 50)
  }

  const handlePreviewScroll = () => {
    if (isSyncing.current || !textareaRef.current || !previewRef.current) return
    
    isSyncing.current = true
    
    const editor = textareaRef.current
    const preview = previewRef.current
    
    const editorScrollable = editor.scrollHeight - editor.clientHeight
    const previewScrollable = preview.scrollHeight - preview.clientHeight
    
    if (editorScrollable > 0 && previewScrollable > 0) {
      const scrollPercent = preview.scrollTop / previewScrollable
      editor.scrollTop = scrollPercent * editorScrollable
    }
    
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editor.scrollTop
    }
    
    setTimeout(() => { isSyncing.current = false }, 50)
  }

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    
    if (e.key === 'Tab') {
      e.preventDefault()
      const spaces = '  '
      const newValue = value.substring(0, start) + spaces + value.substring(end)
      setFormData({ ...formData, content: newValue })
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length
      }, 0)
      return
    }
    
    // 粘贴图片处理
    if (e.ctrlKey && e.key === 'v') {
      // 浏览器会自动触发 paste 事件
      return
    }
    
    const pairs: Record<string, string> = {
      '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`',
    }
    
    if (pairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      const closeChar = pairs[e.key]
      const newValue = value.substring(0, start) + e.key + closeChar + value.substring(end)
      setFormData({ ...formData, content: newValue })
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
      }, 0)
      return
    }
    
    if (e.key === 'Enter') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const currentLine = value.substring(lineStart, start)
      
      const unorderedMatch = currentLine.match(/^(\s*)([-*])\s/)
      if (unorderedMatch) {
        e.preventDefault()
        const [, indent, marker] = unorderedMatch
        const newValue = value.substring(0, start) + '\n' + indent + marker + ' ' + value.substring(end)
        setFormData({ ...formData, content: newValue })
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + indent.length + 3
        }, 0)
        return
      }
      
      const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s/)
      if (orderedMatch) {
        e.preventDefault()
        const [, indent, num] = orderedMatch
        const nextNum = parseInt(num) + 1
        const newValue = value.substring(0, start) + '\n' + indent + nextNum + '. ' + value.substring(end)
        setFormData({ ...formData, content: newValue })
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + indent.length + String(nextNum).length + 2
        }, 0)
        return
      }
      
      const quoteMatch = currentLine.match(/^(\s*>\s*)/)
      if (quoteMatch) {
        e.preventDefault()
        const [, indent] = quoteMatch
        const newValue = value.substring(0, start) + '\n' + indent + value.substring(end)
        setFormData({ ...formData, content: newValue })
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + indent.length + 1
        }, 0)
        return
      }
    }
    
    if (e.key === 'Backspace') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const currentLine = value.substring(lineStart, start)
      
      if (/^(\s*)([-*]|\d+\.)\s*$/.test(currentLine)) {
        e.preventDefault()
        const newValue = value.substring(0, lineStart) + value.substring(end)
        setFormData({ ...formData, content: newValue })
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart
        }, 0)
        return
      }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      const selected = value.substring(start, end)
      const newValue = value.substring(0, start) + '**' + (selected || '粗体文字') + '**' + value.substring(end)
      setFormData({ ...formData, content: newValue })
      setTimeout(() => {
        if (selected) {
          textarea.selectionStart = start
          textarea.selectionEnd = end + 4
        } else {
          textarea.selectionStart = start + 2
          textarea.selectionEnd = start + 6
        }
      }, 0)
      return
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      const selected = value.substring(start, end)
      const newValue = value.substring(0, start) + '*' + (selected || '斜体文字') + '*' + value.substring(end)
      setFormData({ ...formData, content: newValue })
      setTimeout(() => {
        if (selected) {
          textarea.selectionStart = start
          textarea.selectionEnd = end + 2
        } else {
          textarea.selectionStart = start + 1
          textarea.selectionEnd = start + 5
        }
      }, 0)
      return
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      const selected = value.substring(start, end)
      const newValue = value.substring(0, start) + '`' + (selected || 'code') + '`' + value.substring(end)
      setFormData({ ...formData, content: newValue })
      setTimeout(() => {
        if (selected) {
          textarea.selectionStart = start
          textarea.selectionEnd = end + 2
        } else {
          textarea.selectionStart = start + 1
          textarea.selectionEnd = start + 5
        }
      }, 0)
      return
    }
    
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
      e.preventDefault()
      const selected = value.substring(start, end)
      const codeContent = selected || '// 在此输入代码'
      const newValue = value.substring(0, start) + '\n```\n' + codeContent + '\n```\n' + value.substring(end)
      setFormData({ ...formData, content: newValue })
      setTimeout(() => {
        if (selected) {
          textarea.selectionStart = start + 5
          textarea.selectionEnd = end + 5
        } else {
          textarea.selectionStart = start + 5
          textarea.selectionEnd = start + 16
        }
      }, 0)
      return
    }
  }

  // 粘贴事件处理（图片上传）
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return

    e.preventDefault()

    if (!editingDocument?.id) {
      showToast('请先保存文档后再粘贴图片', 'warning')
      return
    }

    setUploading(true)
    try {
      for (const item of imageItems) {
        const file = item.getAsFile()
        if (!file) continue

        await documentAttachmentsApi.apiDocumentAttachmentUploadPost(editingDocument.id, file, true)
      }
      
      showToast('图片上传成功', 'success')
      fetchAttachments(editingDocument.id)
    } catch (error) {
      showToast('图片上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  // 文件上传
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!editingDocument?.id) {
      showToast('请先保存文档后再上传文件', 'warning')
      return
    }

    setUploading(true)
    try {
      await documentAttachmentsApi.apiDocumentAttachmentBatchUploadPost(editingDocument.id, Array.from(files))
      showToast('文件上传成功', 'success')
      fetchAttachments(editingDocument.id)
    } catch (error) {
      showToast('文件上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  // 拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  // 删除附件
  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await documentAttachmentsApi.apiDocumentAttachmentDeletePost({ ids: [attachmentId] })
      showToast('附件已删除', 'success')
      if (editingDocument?.id) {
        fetchAttachments(editingDocument.id)
      }
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  // 复制Markdown链接
  const copyMarkdownLink = async (attachment: DocumentAttachment) => {
    try {
      const response = await documentAttachmentsApi.apiDocumentAttachmentMarkdownLinkGet(attachment.id)
      const markdown = response.data.data?.markdown || ''
      await navigator.clipboard.writeText(markdown)
      setCopiedLink(attachment.id)
      setTimeout(() => setCopiedLink(null), 2000)
      showToast('Markdown链接已复制', 'success')
    } catch (error) {
      showToast('复制失败', 'error')
    }
  }

  // 插入到编辑器
  const insertToEditor = async (attachment: DocumentAttachment) => {
    try {
      const response = await documentAttachmentsApi.apiDocumentAttachmentMarkdownLinkGet(attachment.id)
      const markdown = response.data.data?.markdown || ''
      
      const textarea = textareaRef.current
      if (!textarea) return
      
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = formData.content
      
      const newValue = value.substring(0, start) + '\n' + markdown + '\n' + value.substring(end)
      setFormData({ ...formData, content: newValue })
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + markdown.length + 2
        textarea.focus()
      }, 0)
      
      showToast('已插入到编辑器', 'success')
    } catch (error) {
      showToast('插入失败', 'error')
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.projectId) {
      errors.projectId = '请选择所属项目'
    }
    if (!formData.title.trim()) {
      errors.title = '请输入文档标题'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingDocument) {
        await documentsApi.apiDocumentUpsertPost({
            id: editingDocument.id,
            ...formData,
          })
        showToast('文档更新成功', 'success')
      } else {
        await documentsApi.apiDocumentUpsertPost(formData)
        showToast('文档创建成功', 'success')
      }
      closeModal()
      fetchDocuments()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleEdit = async (doc: Document) => {
    try {
      // 获取完整文档详情（树状接口可能不包含 content）
      const response = await documentsApi.apiDocumentGetDetailGet(doc.id)
      const fullDoc = response.data.data as Document
      const targetDoc = fullDoc || doc
      
      setEditingDocument(targetDoc)
      setFormData({
        projectId: targetDoc.projectId,
        title: targetDoc.title,
        content: targetDoc.content || '',
        parentId: targetDoc.parentId || '',
        sort: targetDoc.sort,
      })
      setFormErrors({})
      setEditMode('split')
      fetchAttachments(targetDoc.id)
      setShowModal(true)
    } catch (error) {
      showToast('获取文档详情失败', 'error')
      // 如果获取失败，仍然使用现有数据
      setEditingDocument(doc)
      setFormData({
        projectId: doc.projectId,
        title: doc.title,
        content: doc.content || '',
        parentId: doc.parentId || '',
        sort: doc.sort,
      })
      setFormErrors({})
      setEditMode('split')
      fetchAttachments(doc.id)
      setShowModal(true)
    }
  }

  const handleView = async (doc: Document) => {
    try {
      // 获取完整文档详情（树状接口可能不包含 content）
      const response = await documentsApi.apiDocumentGetDetailGet(doc.id)
      const fullDoc = response.data.data as Document
      setViewingDocument(fullDoc || doc)
      setShowViewModal(true)
    } catch (error) {
      showToast('获取文档详情失败', 'error')
      // 如果获取失败，仍然显示基本信息
      setViewingDocument(doc)
      setShowViewModal(true)
    }
  }

  const handleDelete = (doc: Document) => {
    setDeletingDocument(doc)
    setShowDeleteModal(true)
  }

  const handleMove = (doc: Document) => {
    setMovingDoc(doc)
    setTargetParentId(doc.parentId || '')
    setShowMoveModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingDocument) return
    try {
      await documentsApi.apiDocumentDeleteDelete({ ids: [deletingDocument.id] })
      showToast('删除成功', 'success')
      fetchDocuments()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingDocument(null)
    }
  }

  const confirmMove = async () => {
    if (!movingDoc) return
    try {
      await documentsApi.apiDocumentMoveMovePost({
        id: movingDoc.id,
        newParentId: targetParentId || null,
        newSort: movingDoc.sort
      } as any)
      showToast('移动成功', 'success')
      fetchDocuments()
      setShowMoveModal(false)
      setMovingDoc(null)
    } catch (error) {
      showToast('移动失败', 'error')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDocument(null)
    setAttachments([])
    setFormData({ projectId: projects[0]?.id || '', title: '', content: '', parentId: '', sort: 0 })
    setFormErrors({})
  }

  const openCreateModal = () => {
    setEditingDocument(null)
    setFormData({ projectId: projects[0]?.id || '', title: '', content: '', parentId: '', sort: 0 })
    setFormErrors({})
    setEditMode('split')
    setAttachments([])
    setShowModal(true)
  }

  // 切换展开/折叠状态，支持按需加载子节点
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set())
  
  const toggleExpand = async (docId: string, node?: Document) => {
    const newExpanded = new Set(expandedDocs)
    
    if (newExpanded.has(docId)) {
      // 折叠
      newExpanded.delete(docId)
      setExpandedDocs(newExpanded)
    } else {
      // 展开 - 检查是否需要按需加载子节点
      newExpanded.add(docId)
      setExpandedDocs(newExpanded)
      
      // 如果节点有 hasChildren 标记但没有 children 数据，则按需加载
      if (node && node.hasChildren && (!node.children || node.children.length === 0)) {
        setLoadingChildren(prev => new Set(prev).add(docId))
        await fetchChildren(docId)
        setLoadingChildren(prev => {
          const next = new Set(prev)
          next.delete(docId)
          return next
        })
      }
    }
  }

  const expandAll = () => {
    // 展开所有项目
    const allProjectIds = new Set(projectDocTree.map(p => p.id))
    setExpandedProjects(allProjectIds)
    
    // 按需加载模式下，只展开已加载的文档节点
    const loadedDocIds = new Set(flattenDocuments(documents).map(d => d.id))
    setExpandedDocs(loadedDocIds)
    
    showToast('已展开所有项目和当前加载的文档节点', 'info')
  }

  const collapseAll = () => {
    setExpandedProjects(new Set())
    setExpandedDocs(new Set())
  }

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || '未知项目'
  }

  const getProjectColor = (projectId: string) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal']
    const index = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  // 切换项目展开/折叠
  const toggleProjectExpand = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  // 渲染项目文档树（项目作为主节点）
  const renderProjectDocTree = () => {
    return projectDocTree.map(project => {
      const isProjectExpanded = expandedProjects.has(project.id)
      const hasDocuments = project.documents && project.documents.length > 0
      
      return (
        <div key={project.id} className="mb-2">
          {/* 项目节点 */}
          <div 
            className="flex items-center gap-2 p-2 rounded-lg bg-surface-100 dark:bg-surface-800/50 hover:bg-surface-200 dark:hover:bg-surface-800 group"
          >
            {hasDocuments ? (
              <button 
                onClick={() => toggleProjectExpand(project.id)}
                className="p-1 rounded hover:bg-surface-300 dark:hover:bg-surface-700 flex items-center justify-center w-6 h-6"
              >
                {isProjectExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-surface-600" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-surface-600" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            
            <FolderIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
            
            <span className="flex-1 font-semibold text-surface-900 dark:text-white truncate text-sm">
              {project.name}
            </span>
            
            {project.code && (
              <Badge variant="secondary" size="sm" className="text-xs">{project.code}</Badge>
            )}
            
            <span className="text-xs text-surface-500">
              {project.documents?.length || 0} 个文档
            </span>
          </div>
          
          {/* 项目下的文档树 */}
          {isProjectExpanded && hasDocuments && (
            <div className="mt-1 ml-2">
              {renderDocTree(project.documents, 0)}
            </div>
          )}
        </div>
      )
    })
  }

  // 渲染文档树
  const renderDocTree = (nodes: Document[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedDocs.has(node.id)
      const isLoadingChildren = loadingChildren.has(node.id)
      // 按需加载模式下，使用 hasChildren 标记来判断是否有子节点
      const hasChildren = node.hasChildren || (node.children && node.children.length > 0)
      const hasLoadedChildren = node.children && node.children.length > 0
      
      return (
        <div key={node.id} className={level > 0 ? 'ml-4 border-l-2 border-surface-200 dark:border-surface-700' : ''}>
          <div 
            className={`flex items-center gap-2 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 group ${
              movingDoc?.id === node.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            {hasChildren ? (
              <button 
                onClick={() => toggleExpand(node.id, node)}
                className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center w-6 h-6"
                disabled={isLoadingChildren}
              >
                {isLoadingChildren ? (
                  <div className="w-3 h-3 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin" />
                ) : isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-surface-500" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-surface-500" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            
            <DocumentTextIcon className={`w-5 h-5 text-${getProjectColor(node.projectId)}-500 flex-shrink-0`} />
            
            <span className="flex-1 font-medium text-surface-900 dark:text-white truncate text-sm">
              {node.title}
            </span>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip content="查看" placement="top">
                <button
                  onClick={() => handleView(node)}
                  className="p-1.5 rounded text-surface-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="编辑" placement="top">
                <button
                  onClick={() => handleEdit(node)}
                  className="p-1.5 rounded text-surface-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="移动" placement="top">
                <button
                  onClick={() => handleMove(node)}
                  className="p-1.5 rounded text-surface-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <FolderArrowDownIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="删除" placement="top">
                <button
                  onClick={() => handleDelete(node)}
                  className="p-1.5 rounded text-surface-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>
          
          {isExpanded && hasLoadedChildren && (
            <div className="mt-1">
              {renderDocTree(node.children!, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  // 渲染附件列表
  const renderAttachments = () => {
    if (attachments.length === 0) {
      return (
        <div className="text-center py-8 text-surface-500">
          <PaperClipIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无附件</p>
          <p className="text-xs mt-1">拖拽文件到此处或点击上传</p>
        </div>
      )
    }

    if (fileViewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 gap-2">
          {attachments.map(attachment => (
            <div 
              key={attachment.id} 
              className="p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {attachment.mimeType?.startsWith('image/') ? (
                    <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 overflow-hidden">
                      <img 
                        src={`/api/documentattachment/content?id=${attachment.id}`}
                        alt={attachment.fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                      {getFileIcon(attachment.mimeType)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={attachment.fileName}>
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-surface-500">{formatFileSize(attachment.fileSize)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-surface-100 dark:border-surface-800">
                <Tooltip content="插入到编辑器" placement="top">
                  <button
                    onClick={() => insertToEditor(attachment)}
                    className="flex-1 px-2 py-1 text-xs rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/40"
                  >
                    插入
                  </button>
                </Tooltip>
                <Tooltip content="复制链接" placement="top">
                  <button
                    onClick={() => copyMarkdownLink(attachment)}
                    className="p-1 text-xs rounded hover:bg-surface-100 dark:hover:bg-surface-700"
                  >
                    {copiedLink === attachment.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                  </button>
                </Tooltip>
                <Tooltip content="下载" placement="top">
                  <a
                    href={`/api/documentattachment/download?id=${attachment.id}`}
                    download
                    className="p-1 text-xs rounded hover:bg-surface-100 dark:hover:bg-surface-700"
                  >
                    <DocumentArrowUpIcon className="w-4 h-4" />
                  </a>
                </Tooltip>
                <Tooltip content="删除" placement="top">
                  <button
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    className="p-1 text-xs rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-1">
        {attachments.map(attachment => (
          <div 
            key={attachment.id} 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 group"
          >
            {getFileIcon(attachment.mimeType)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
              <p className="text-xs text-surface-500">{formatFileSize(attachment.fileSize)}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => insertToEditor(attachment)} className="p-1.5 rounded hover:bg-primary-50 text-primary-600">
                <LinkIcon className="w-4 h-4" />
              </button>
              <button onClick={() => copyMarkdownLink(attachment)} className="p-1.5 rounded hover:bg-surface-100">
                {copiedLink === attachment.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
              </button>
              <a href={`/api/documentattachment/download?id=${attachment.id}`} download className="p-1.5 rounded hover:bg-surface-100">
                <DocumentArrowUpIcon className="w-4 h-4" />
              </a>
              <button onClick={() => handleDeleteAttachment(attachment.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const columns = [
    {
      key: 'title',
      title: '文档标题',
      render: (doc: Document) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-${getProjectColor(doc.projectId)}-100 dark:bg-${getProjectColor(doc.projectId)}-900/30 flex items-center justify-center`}>
            <DocumentTextIcon className={`w-5 h-5 text-${getProjectColor(doc.projectId)}-600 dark:text-${getProjectColor(doc.projectId)}-400`} />
          </div>
          <div>
            <div className="font-medium text-surface-900 dark:text-white">{doc.title}</div>
            <div className="text-xs text-surface-500">
              排序: {doc.sort}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'project',
      title: '所属项目',
      render: (doc: Document) => (
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-surface-400" />
          <Badge variant="primary" size="sm">
            {getProjectName(doc.projectId)}
          </Badge>
        </div>
      )
    },
    {
      key: 'content',
      title: '内容预览',
      render: (doc: Document) => (
        <span className="text-sm text-surface-500 dark:text-surface-400 truncate max-w-xs block">
          {(doc.content || '').substring(0, 50)}{(doc.content || '').length > 50 ? '...' : ''}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      render: (doc: Document) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip content="查看" placement="top">
            <button
              onClick={() => handleView(doc)}
              className="p-2 rounded-lg text-surface-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="编辑" placement="top">
            <button
              onClick={() => handleEdit(doc)}
              className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="移动" placement="top">
            <button
              onClick={() => handleMove(doc)}
              className="p-2 rounded-lg text-surface-600 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <FolderArrowDownIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="删除" placement="top">
            <button
              onClick={() => handleDelete(doc)}
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">文档管理</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            管理知识库文档，支持 Markdown 富文本编辑和文件附件
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<PlusIcon className="w-4 h-4" />}>
          新增文档
        </Button>
      </div>

      {/* Filters & View Toggle */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="搜索文档标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Select
              value={selectedProject}
              onChange={(value) => setSelectedProject(value)}
              options={[{ value: '', label: '所有项目' }, ...projects.map(p => ({ value: p.id, label: p.name }))]}
              size="md"
              className="w-48"
            />
            <div className="flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1 flex-shrink-0 min-h-[44px]">
              <Tooltip content="列表视图" placement="top">
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${viewMode === 'list' ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}
                >
                  <Bars3Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">列表</span>
                </button>
              </Tooltip>
              <Tooltip content="树状视图" placement="top">
                <button 
                  onClick={() => setViewMode('tree')} 
                  className={`px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${viewMode === 'tree' ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}
                >
                  <FolderIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">树状</span>
                </button>
              </Tooltip>
            </div>
            <Button variant="secondary" leftIcon={<ArrowPathIcon className="w-4 h-4 flex-shrink-0" />} onClick={fetchDocuments} className="flex-shrink-0 whitespace-nowrap min-h-[44px]">
              刷新
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      <Card noPadding>
        {loading ? (
          <LoadingSpinner centered text="加载中..." />
        ) : viewMode === 'list' ? (
          filteredDocuments.length === 0 ? (
            <EmptyState
              title={searchQuery ? '未找到匹配的文档' : '暂无文档'}
              description={searchQuery ? '请尝试其他搜索条件' : '点击上方按钮添加第一个文档'}
              action={!searchQuery ? { label: '新增文档', onClick: openCreateModal } : undefined}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredDocuments}
              rowKey="id"
              noBorder
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
              }}
            />
          )
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-surface-500">
                共 {projectDocTree.length} 个项目，{flattenDocuments(documents).length} 个文档
              </span>
              <div className="flex gap-2">
                <button onClick={expandAll} className="text-xs px-2 py-1 rounded bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700">
                  展开全部
                </button>
                <button onClick={collapseAll} className="text-xs px-2 py-1 rounded bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700">
                  收起全部
                </button>
              </div>
            </div>
            {projectDocTree.length === 0 ? (
              <EmptyState
                title="暂无项目或文档"
                description="点击上方按钮添加第一个文档"
                action={{ label: '新增文档', onClick: openCreateModal }}
              />
            ) : (
              renderProjectDocTree()
            )}
          </div>
        )}
      </Card>

      {/* Create/Edit Modal with Rich Editor */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingDocument ? '编辑文档' : '新增文档'}
        description={editingDocument ? '修改文档内容和属性' : '创建新文档'}
        size="full"
        className="!max-w-[98vw] !h-[95vh]"
        contentClassName="!overflow-hidden !p-0"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              {editingDocument && (
                <Button variant="secondary" leftIcon={<PaperClipIcon className="w-4 h-4" />} onClick={() => setShowFileModal(true)}>
                  附件 ({attachments.length})
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={closeModal}>取消</Button>
              <Button onClick={handleSubmit} leftIcon={<BookOpenIcon className="w-4 h-4" />}>
                {editingDocument ? '保存修改' : '创建文档'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-full p-6" style={{ height: 'calc(95vh - 140px)' }}>
          {/* Form Header */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4 flex-shrink-0">
            <div className="sm:w-1/3">
              <Select
                label="所属项目"
                value={formData.projectId}
                onChange={(value) => setFormData({ ...formData, projectId: value })}
                options={[{ value: '', label: '请选择项目' }, ...projects.map(project => ({ value: project.id, label: project.name }))]}
                error={formErrors.projectId}
              />
            </div>
            <div className="flex-1">
              <Input label="文档标题" placeholder="请输入文档标题" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} error={formErrors.title} required />
            </div>
            <div className="sm:w-48">
              <Select
                label="父文档"
                value={formData.parentId}
                onChange={(value) => setFormData({ ...formData, parentId: value })}
                options={[{ value: '', label: '-- 无父文档 --' }, ...flattenDocuments(documents)
                  .filter(d => d.id !== editingDocument?.id)
                  .map(doc => ({ value: doc.id, label: doc.title }))]}
              />
            </div>
            <div className="sm:w-24">
              <Input label="排序" type="number" placeholder="排序" value={formData.sort.toString()} onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Editor Toolbar */}
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <label className="form-label mb-0">文档内容</label>
            <div className="flex items-center gap-2">
              {editingDocument && (
                <div 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${dragOver ? 'bg-primary-100 text-primary-700 border-2 border-primary-300 border-dashed' : 'bg-surface-100 dark:bg-surface-800 text-surface-600'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <CloudArrowUpIcon className="w-4 h-4" />
                  <span>支持拖拽上传文件</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="ml-2 px-2 py-0.5 bg-primary-600 text-white rounded text-xs hover:bg-primary-700"
                  >
                    选择文件
                  </button>
                </div>
              )}
              <div className="flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
                <button onClick={() => setEditMode('split')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${editMode === 'split' ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
                  <ArrowsPointingOutIcon className="w-4 h-4" />分屏
                </button>
                <button onClick={() => setEditMode('edit')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${editMode === 'edit' ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
                  <CodeBracketIcon className="w-4 h-4" />编辑
                </button>
                <button onClick={() => setEditMode('preview')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${editMode === 'preview' ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
                  <EyeIcon className="w-4 h-4" />预览
                </button>
              </div>
            </div>
          </div>

          {/* Rich Markdown Editor */}
          <div 
            ref={editorContainerRef}
            className="flex-1 border border-surface-300 dark:border-surface-600 rounded-xl overflow-hidden flex flex-col"
            style={{ height: 'calc(95vh - 280px)', minHeight: '400px' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {editMode === 'split' && (
              <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 flex flex-col border-r border-surface-300 dark:border-surface-600 overflow-hidden">
                  <div className="px-3 py-2 bg-surface-100 dark:bg-surface-800 border-b border-surface-300 dark:border-surface-600 text-xs font-medium text-surface-600 dark:text-surface-400 flex-shrink-0">
                    Markdown 编辑 (Ctrl+B 粗体, Ctrl+I 斜体, Ctrl+K 代码, 粘贴图片自动上传)
                  </div>
                  <div className="flex-1 flex overflow-hidden">
                    <div ref={lineNumbersRef} className="w-12 flex-shrink-0 bg-surface-50 dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 text-right pr-2 text-xs text-surface-400 font-mono select-none overflow-y-hidden pt-4" style={{ lineHeight: '1.25rem' }}>
                      {formData.content.split('\n').map((_, i) => (
                        <div key={i} style={{ height: '1.25rem' }}>{i + 1}</div>
                      ))}
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      onScroll={handleEditorScroll}
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                      className="flex-1 pt-4 pr-4 pb-4 pl-4 resize-none bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 font-mono text-sm focus:outline-none overflow-y-auto"
                      placeholder="输入 Markdown 内容...&#10;快捷键: Ctrl+B 粗体, Ctrl+I 斜体, Ctrl+K 行内代码, Ctrl+Shift+K 代码块&#10;支持直接粘贴图片上传"
                      spellCheck={false}
                      style={{ tabSize: 2, lineHeight: '1.25rem' }}
                    />
                  </div>
                </div>
                <div className="w-1/2 flex flex-col overflow-hidden">
                  <div className="px-3 py-2 bg-surface-100 dark:bg-surface-800 border-b border-surface-300 dark:border-surface-600 text-xs font-medium text-surface-600 dark:text-surface-400 flex-shrink-0">
                    实时预览
                  </div>
                  <div ref={previewRef} onScroll={handlePreviewScroll} className="flex-1 overflow-y-auto p-4 bg-white dark:bg-surface-900 prose dark:prose-invert max-w-none prose-pre:bg-surface-100 dark:prose-pre:bg-surface-900">
                    <div dangerouslySetInnerHTML={{ __html: mdParser.render(formData.content || '') }} />
                  </div>
                </div>
              </div>
            )}
            {editMode === 'edit' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-surface-100 dark:bg-surface-800 border-b border-surface-300 dark:border-surface-600 text-xs font-medium text-surface-600 dark:text-surface-400 flex-shrink-0">
                  Markdown 编辑
                </div>
                <div className="flex-1 flex overflow-hidden">
                  <div ref={lineNumbersRef} className="w-12 flex-shrink-0 bg-surface-50 dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 text-right pr-2 text-xs text-surface-400 font-mono select-none overflow-y-hidden pt-4" style={{ lineHeight: '1.25rem' }}>
                    {formData.content.split('\n').map((_, i) => (
                      <div key={i} style={{ height: '1.25rem' }}>{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    onScroll={handleEditorScroll}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    className="flex-1 pt-4 pr-4 pb-4 pl-4 resize-none bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 font-mono text-sm focus:outline-none overflow-y-auto"
                    placeholder="输入 Markdown 内容..."
                    spellCheck={false}
                    style={{ tabSize: 2, lineHeight: '1.25rem' }}
                  />
                </div>
              </div>
            )}
            {editMode === 'preview' && (
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-surface-900 prose dark:prose-invert max-w-none prose-pre:bg-surface-100 dark:prose-pre:bg-surface-900">
                <div dangerouslySetInnerHTML={{ __html: mdParser.render(formData.content || '') }} />
              </div>
            )}
          </div>
          
          {uploading && (
            <div className="absolute inset-0 bg-surface-900/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 flex items-center gap-3">
                <LoadingSpinner size="sm" />
                <span>上传中...</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* File Attachments Modal */}
      <Modal
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
        title="文档附件"
        description={`${editingDocument?.title} 的附件管理`}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowFileModal(false)}>关闭</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-300 dark:border-surface-600'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-2 text-surface-400" />
            <p className="text-sm text-surface-600 dark:text-surface-400">拖拽文件到此处上传</p>
            <p className="text-xs text-surface-500 mt-1">或</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
              选择文件
            </Button>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-surface-500">共 {attachments.length} 个附件</span>
            <div className="flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
              <button onClick={() => setFileViewMode('grid')} className={`px-2 py-1 rounded text-xs ${fileViewMode === 'grid' ? 'bg-white dark:bg-surface-700 shadow-sm' : ''}`}>
                网格
              </button>
              <button onClick={() => setFileViewMode('list')} className={`px-2 py-1 rounded text-xs ${fileViewMode === 'list' ? 'bg-white dark:bg-surface-700 shadow-sm' : ''}`}>
                列表
              </button>
            </div>
          </div>
          
          {/* Attachments List */}
          <div className="max-h-[400px] overflow-y-auto">
            {renderAttachments()}
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={viewingDocument?.title}
        description={`所属项目: ${viewingDocument ? getProjectName(viewingDocument.projectId) : ''}`}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            {viewingDocument && (
              <Button variant="secondary" leftIcon={<PencilIcon className="w-4 h-4" />} onClick={() => { setShowViewModal(false); handleEdit(viewingDocument); }}>
                编辑
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>关闭</Button>
          </div>
        }
      >
        {viewingDocument && (
          <div className="max-h-[70vh] overflow-auto">
            <div className="prose dark:prose-invert max-w-none bg-surface-50 dark:bg-surface-900 rounded-xl p-6" dangerouslySetInnerHTML={{ __html: mdParser.render(viewingDocument.content || '') }} />
          </div>
        )}
      </Modal>

      {/* Move Modal */}
      <Modal
        isOpen={showMoveModal}
        onClose={() => { setShowMoveModal(false); setMovingDoc(null); }}
        title="移动文档"
        description="选择新的父文档位置"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowMoveModal(false); setMovingDoc(null); }}>取消</Button>
            <Button onClick={confirmMove}>确认移动</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">当前文档</label>
            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <span className="font-medium">{movingDoc?.title}</span>
            </div>
          </div>
          <Select
            label="目标位置（留空设为根文档）"
            value={targetParentId}
            onChange={(value) => setTargetParentId(value)}
            options={[{ value: '', label: '-- 设为根文档 --' }, ...flattenDocuments(documents)
              .filter(d => d.id !== movingDoc?.id)
              .map(doc => ({ value: doc.id, label: doc.title }))]}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除"
        description={`确定要删除文档 "${deletingDocument?.title}" 吗？此操作不可恢复，子文档也会被一并删除。`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>取消</Button>
            <Button variant="danger" onClick={confirmDelete}>确认删除</Button>
          </div>
        }
      />
    </div>
  )
}
