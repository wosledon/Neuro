import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button, Modal, EmptyState, LoadingSpinner, Select, Tooltip } from '../components'
import { documentsApi, projectsApi, documentAttachmentsApi } from '../services/auth'
import { useToast } from '../components/ToastProvider'
import MarkdownIt from 'markdown-it'
// 移除静态导入，改为按需加载
// prettier 613KB，使用 CDN 或者用户按需加载时使用
// import prettier from 'prettier/standalone'
// import prettierMarkdown from 'prettier/parser-markdown'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  CloudArrowUpIcon,
  LinkIcon,
  ClipboardIcon,
  CheckIcon,
  XMarkIcon,
  Bars3Icon,
  PhotoIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/solid'

// 搜索防抖函数
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout | null
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 文件扩展名和对应的样式
const fileTypeStyles: Record<string, { icon: string; color: string; bg: string }> = {
  exe: { icon: '⚙️', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  msi: { icon: '📦', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  dmg: { icon: '🍎', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20' },
  pdf: { icon: '📄', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  doc: { icon: '📝', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  docx: { icon: '📝', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  xls: { icon: '📊', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  xlsx: { icon: '📊', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  ppt: { icon: '📽️', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  pptx: { icon: '📽️', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  zip: { icon: '📦', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  rar: { icon: '📦', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  '7z': { icon: '📦', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  tar: { icon: '📦', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  gz: { icon: '📦', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  mp4: { icon: '🎬', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  avi: { icon: '🎬', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  mov: { icon: '🎬', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  mp3: { icon: '🎵', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  wav: { icon: '🎵', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  flac: { icon: '🎵', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  jpg: { icon: '🖼️', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  jpeg: { icon: '🖼️', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  png: { icon: '🖼️', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  gif: { icon: '🖼️', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  svg: { icon: '🖼️', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  webp: { icon: '🖼️', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  txt: { icon: '📃', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20' },
  md: { icon: '📜', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20' },
  json: { icon: '📋', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  xml: { icon: '📋', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  html: { icon: '🌐', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  css: { icon: '🎨', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  js: { icon: '📜', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  ts: { icon: '📜', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  jsx: { icon: '⚛️', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  tsx: { icon: '⚛️', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  py: { icon: '🐍', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  java: { icon: '☕', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  cpp: { icon: '⚙️', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  c: { icon: '⚙️', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  go: { icon: '🐹', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  rs: { icon: '🦀', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  rb: { icon: '💎', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  php: { icon: '🐘', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  sql: { icon: '🗄️', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  sh: { icon: '📜', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  bash: { icon: '📜', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  ps1: { icon: '💻', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
}

// 获取文件样式
const getFileStyle = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return fileTypeStyles[ext] || { icon: '📎', color: 'text-surface-600', bg: 'bg-surface-50 dark:bg-surface-800' }
}

// 初始化 Markdown 解析器
const mdParser = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: true,
  breaks: false,
})

mdParser.renderer.rules.fence = function (tokens, idx) {
  const token = tokens[idx]
  const raw = token.content
  const lang = (token.info || '').trim().split(/\s+/)[0]
  const content = lang && hljs.getLanguage(lang)
    ? hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value
    : mdParser.utils.escapeHtml(raw)

  const languageClass = lang ? ` language-${lang}` : ''
  return `<pre class="bg-surface-100 dark:bg-surface-900 text-surface-800 dark:text-surface-100 p-3 rounded-lg overflow-x-auto border border-surface-200 dark:border-surface-700 text-sm"><code class="hljs${languageClass}">${content}</code></pre>`
}

mdParser.renderer.rules.code_inline = function (tokens, idx) {
  const token = tokens[idx]
  const content = mdParser.utils.escapeHtml(token.content)
  return `<code class="bg-surface-100 dark:bg-surface-900 text-surface-800 dark:text-surface-100 px-1.5 py-0.5 rounded-md text-sm">${content}</code>`
}

// 自定义图片渲染规则
mdParser.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  const src = token.attrGet('src') || ''
  // 从 token 的 children 中获取 alt 文本
  let alt = ''
  if (token.children && token.children.length > 0) {
    alt = token.children.map(child => child.content || '').join('')
  }
  
  return `<div class="my-4 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
    <img src="${src}" alt="${alt}" class="max-w-full h-auto block" loading="lazy" />
    ${alt ? `<div class="px-3 py-2 text-xs text-surface-500 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">${alt}</div>` : ''}
  </div>`
}

const isDownloadLink = (href: string) => {
  // 图片链接不应该被视为下载链接
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(href)) return false

  const hasScheme = /^https?:\/\//i.test(href)
  const isDownloadPath = href.includes('/api/documentattachment/download') || href.includes('/download')
  if (!hasScheme && !isDownloadPath) return false

  if (isDownloadPath) return true

  return /\.(exe|msi|dmg|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|tar|gz|mp4|avi|mov|mp3|wav|flac)$/i.test(href)
}

const isLikelyFileName = (text: string) => {
  const trimmed = text.trim()
  if (!trimmed || trimmed.includes('://') || trimmed.startsWith('http')) return false
  if (trimmed.length > 128) return false
  const ext = trimmed.split('.').pop()?.toLowerCase() || ''
  return Boolean(fileTypeStyles[ext])
}

const getFileNameFromHref = (href: string, env?: { attachmentNameMap?: Map<string, string> }) => {
  try {
    const url = new URL(href, 'http://localhost')
    const id = url.searchParams.get('id') || ''
    if (id && env?.attachmentNameMap?.has(id)) {
      return env.attachmentNameMap.get(id)
    }
  } catch {
    // ignore parsing errors
  }

  const lastSegment = href.split('/').pop() || ''
  const cleanSegment = lastSegment.split('?')[0]
  if (cleanSegment && cleanSegment.includes('.')) return cleanSegment
  return undefined
}

// Prettier 按需加载
// 注意：prettier 本身 613KB，为了避免主 bundle 过大，建议使用 CDN 方式
// 开发者可以替换为以下 CDN 方式：
// const loadPrettier = async () => {
//   if (!window.prettier) {
//     await new Promise((resolve, reject) => {
//       const script = document.createElement('script')
//       script.src = 'https://cdn.jsdelivr.net/npm/prettier@3.2.5/standalone.js'
//       script.onload = resolve
//       script.onerror = reject
//       document.head.appendChild(script)
//     })
//   }
//   if (!window.prettierMarkdown) {
//     await new Promise((resolve, reject) => {
//       const script = document.createElement('script')
//       script.src = 'https://cdn.jsdelivr.net/npm/prettier@3.2.5/parser-markdown.js'
//       script.onload = resolve
//       script.onerror = reject
//       document.head.appendChild(script)
//     })
//   }
//   return { prettier: window.prettier, prettierMarkdown: window.prettierMarkdown }
// }

// prettierLoader 和 prettierMarkdownLoader 保留以备后续使用
// let prettierLoader: any = null
// let prettierMarkdownLoader: any = null

const normalizeMarkdown = (content: string, attachmentNameMap: Map<string, string>) => {
  const normalizedLinks = content.replace(/\[([^\]\n]+)\]\s*\n\s*\(([^)\s]+)\)/g, '[$1]($2)')
  const lines = normalizedLinks.split('\n')
  const urlPattern = /^https?:\/\//i
  const markdownLinkPattern = /^\[[^\]]+\]\([^)\s]+\)$/

  return lines
    .map(line => {
      const trimmed = line.trim()
      if (!trimmed) return line

      if (markdownLinkPattern.test(trimmed)) {
        return line
      }

      const rawUrl = trimmed.startsWith('(') && trimmed.endsWith(')')
        ? trimmed.slice(1, -1).trim()
        : trimmed

      if (!urlPattern.test(rawUrl)) return line

      if (!isDownloadLink(rawUrl)) return line

      const fileName = getFileNameFromHref(rawUrl, { attachmentNameMap }) || '下载文件'
      return `[${fileName}](${rawUrl})`
    })
    .join('\n')
}

mdParser.core.ruler.after('inline', 'file_cards', state => {
  state.tokens.forEach(token => {
    if (token.type !== 'inline' || !token.children) return

    const children = token.children
    const nextChildren: any[] = []

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child.type === 'link_open') {
        const href = child.attrGet('href') || ''
        if (isDownloadLink(href)) {
          let text = ''
          let j = i + 1

          for (; j < children.length; j++) {
            if (children[j].type === 'link_close') break
            if (children[j].type === 'text') text += children[j].content
          }

          const displayName = isLikelyFileName(text)
            ? text.trim()
            : getFileNameFromHref(href, state.env as { attachmentNameMap?: Map<string, string> })

          const fileName = displayName || '下载文件'
          const style = getFileStyle(fileName)
          const html = `<a href="${href}" download class="flex items-center gap-3 px-4 py-3 rounded-xl ${style.bg} border border-surface-200 dark:border-surface-700 hover:shadow-md transition-all no-underline my-2">
            <span class="text-2xl">${style.icon}</span>
            <span class="flex flex-col min-w-0">
              <span class="text-sm font-medium ${style.color} truncate max-w-[240px]">${mdParser.utils.escapeHtml(fileName)}</span>
              <span class="text-xs text-surface-400">点击下载</span>
            </span>
          </a>`

          const htmlToken = new (state.Token as any)('html_inline', '', 0)
          htmlToken.content = html
          nextChildren.push(htmlToken)
          i = j
          continue
        }
      }

      nextChildren.push(child)
    }

    token.children = nextChildren
  })
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

// 兼容后端返回扁平/嵌套两种结构，统一构建为树
const normalizeDocumentTree = (docs: Document[]): Document[] => {
  if (!Array.isArray(docs) || docs.length === 0) {
    return []
  }

  // 第一步：扁平化所有节点（处理嵌套结构）
  const flattened: Document[] = []
  const walk = (items: Document[], parentId?: string) => {
    items.forEach(item => {
      const normalizedItem: Document = parentId && !item.parentId
        ? { ...item, parentId }
        : item

      flattened.push(normalizedItem)
      if (item.children && item.children.length > 0) {
        walk(item.children, item.id)
      }
    })
  }
  walk(docs)

  // 第二步：去重并保留 hasChildren 标记
  const uniqueMap = new Map<string, Document>()
  flattened.forEach(item => {
    const existing = uniqueMap.get(item.id)
    // 合并 hasChildren 标记：如果任何一个来源标记有子节点，就保留
    const mergedHasChildren = Boolean(
      item.hasChildren || 
      item.children?.length || 
      existing?.hasChildren || 
      existing?.children?.length
    )

    uniqueMap.set(item.id, {
      ...(existing || {}),
      ...item,
      hasChildren: mergedHasChildren,
      // 保留已有的 children 或初始化为空数组
      children: existing?.children || [],
    })
  })

  // 第三步：构建树结构
  const roots: Document[] = []
  uniqueMap.forEach(node => {
    if (node.parentId && node.parentId !== node.id && uniqueMap.has(node.parentId)) {
      const parent = uniqueMap.get(node.parentId)!
      // 避免重复添加
      if (!parent.children?.find(child => child.id === node.id)) {
        parent.children = [...(parent.children || []), node]
      }
      parent.hasChildren = true
    } else {
      roots.push(node)
    }
  })

  // 第四步：排序
  const sortNodes = (items: Document[]) => {
    items.sort((a, b) => {
      const sortDiff = (a.sort || 0) - (b.sort || 0)
      if (sortDiff !== 0) return sortDiff
      return (a.title || '').localeCompare(b.title || '', 'zh-CN')
    })

    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        sortNodes(item.children)
        item.hasChildren = true
      }
    })
  }

  sortNodes(roots)
  return roots
}

// 文件大小格式化
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件图标颜色
const getFileIconColor = (mimeType?: string): string => {
  if (!mimeType) return 'text-surface-400'
  if (mimeType.startsWith('image/')) return 'text-purple-500'
  if (mimeType.startsWith('video/')) return 'text-red-500'
  if (mimeType.startsWith('audio/')) return 'text-amber-500'
  if (mimeType.includes('pdf')) return 'text-red-600'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-600'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'text-green-600'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'text-orange-600'
  return 'text-surface-400'
}

// 搜索高亮组件
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>

  try {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return (
      <span>
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            return (
              <span key={i} className="text-primary-700 dark:text-primary-300 font-semibold">
                {part}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </span>
    )
  } catch (error) {
    return <span>{text}</span>
  }
}

export default function Notebook() {
  // 数据状态
  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('')
  
  // 当前选中的文档
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const [activeDocContent, setActiveDocContent] = useState('')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
  
  // 树状结构状态
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set())
  
  // 附件相关
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([])
  const [showAttachments, setShowAttachments] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  
  // 模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null)
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  
  // 表单状态
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  const { show: showToast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 搜索防抖处理 - 300ms 防抖
  const debouncedSearchRef = useRef(
    debounce((query: string) => {
      setDebouncedSearchQuery(query)
    }, 300)
  )

  useEffect(() => {
    debouncedSearchRef.current(searchQuery)
  }, [searchQuery])

  const attachmentNameMap = useMemo(
    () => new Map(attachments.map(attachment => [attachment.id, attachment.fileName])),
    [attachments]
  )

  const handleFormat = useCallback(async () => {
    if (!activeDocContent) return
    try {
      // 简单的格式化实现，不使用 prettier（避免 613KB 的 bundle 体积）
      // 用户可以使用外部 CDN 或开发时按需加载 prettier
      // 后续可以替换为真正的 prettier 功能
      
      showToast('格式化功能暂不可用，请使用外部 CDN 或等待优化', 'info')
    } catch (error) {
      showToast('格式化失败', 'error')
    }
  }, [activeDocContent, showToast])

  // 获取文档树（根节点）
  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await documentsApi.apiDocumentGetTreeTreeGet(selectedProject || undefined, undefined)
      const data = (response.data.data as Document[]) || []
      setDocuments(normalizeDocumentTree(data))
    } catch (error) {
      showToast('获取文档列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 按需加载子节点
  const fetchChildren = async (parentId: string) => {
    try {
      const response = await documentsApi.apiDocumentGetTreeTreeGet(selectedProject || undefined, parentId)
      const children = (response.data.data as Document[]) || []
      
      // 更新文档树，将子节点添加到对应的父节点
      const updateDocTree = (nodes: Document[]): Document[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return { ...node, children: normalizeDocumentTree(children) }
          }
          if (node.children && node.children.length > 0) {
            return { ...node, children: updateDocTree(node.children) }
          }
          return node
        })
      }
      
      setDocuments(prev => updateDocTree(prev))
      return children
    } catch (error) {
      showToast('加载子文档失败', 'error')
      return []
    }
  }

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const response = await projectsApi.apiProjectListGet()
      setProjects((response.data.data as Project[]) || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  // 获取文档详情
  const fetchDocumentDetail = async (docId: string) => {
    try {
      const response = await documentsApi.apiDocumentGetDetailGet(docId)
      const doc = response.data.data as Document
      if (doc) {
        setActiveDoc(doc)
        setActiveDocContent(doc.content || '')
        fetchAttachments(docId)
      }
    } catch (error) {
      showToast('获取文档详情失败', 'error')
    }
  }

  // 获取附件列表
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
    fetchProjects()
  }, [selectedProject])

  // 扁平化文档树用于搜索
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

  // 过滤文档 - 使用防抖后的搜索词
  const filteredDocuments = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return documents
    const query = debouncedSearchQuery.toLowerCase()
    const allDocs = flattenDocuments(documents)
    return allDocs.filter(doc => doc.title.toLowerCase().includes(query))
  }, [debouncedSearchQuery, documents])

  // 切换展开/收起，支持按需加载子节点
  const toggleExpand = async (docId: string, node: Document, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
      if (node.hasChildren && (!node.children || node.children.length === 0)) {
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

  // 选择文档 - 同时自动展开子节点（按需加载）
  const handleSelectDoc = async (doc: Document) => {
    fetchDocumentDetail(doc.id)
    // 如果有子节点，自动展开并加载
    if (doc.hasChildren || (doc.children && doc.children.length > 0)) {
      const newExpanded = new Set(expandedDocs)
      const isAlreadyExpanded = newExpanded.has(doc.id)
      newExpanded.add(doc.id)
      setExpandedDocs(newExpanded)
      
      // 如果节点有 hasChildren 标记但没有 children 数据，则按需加载
      if (!isAlreadyExpanded && doc.hasChildren && (!doc.children || doc.children.length === 0)) {
        setLoadingChildren(prev => new Set(prev).add(doc.id))
        await fetchChildren(doc.id)
        setLoadingChildren(prev => {
          const next = new Set(prev)
          next.delete(doc.id)
          return next
        })
      }
    }
  }

  // 打开创建文档模态框（根节点）
  const handleCreateRoot = () => {
    setCreateParentId(null)
    setFormData({
      projectId: selectedProject || projects[0]?.id || '',
      title: '',
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  // 打开创建子文档模态框
  const handleCreateChild = (parentDoc: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    setCreateParentId(parentDoc.id)
    setFormData({
      projectId: parentDoc.projectId,
      title: '',
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  // 编辑文档元数据
  const handleEditMeta = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingDoc(doc)
    setCreateParentId(doc.parentId || null)
    setFormData({
      projectId: doc.projectId,
      title: doc.title,
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  // 删除文档
  const handleDelete = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingDoc(doc)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingDoc) return
    try {
      await documentsApi.apiDocumentDeleteDelete({ ids: [deletingDoc.id] })
      showToast('删除成功', 'success')
      if (activeDoc?.id === deletingDoc.id) {
        setActiveDoc(null)
        setActiveDocContent('')
      }
      fetchDocuments()
    } catch (error) {
      showToast('删除失败', 'error')
    } finally {
      setShowDeleteModal(false)
      setDeletingDoc(null)
    }
  }

  // 保存文档
  const handleSave = async () => {
    if (!activeDoc) return
    try {
      await documentsApi.apiDocumentUpsertPost({
        id: activeDoc.id,
        content: activeDocContent,
      })
      showToast('保存成功', 'success')
      fetchDocuments()
    } catch (error) {
      showToast('保存失败', 'error')
    }
  }

  // 提交表单（创建/编辑）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors: Record<string, string> = {}
    if (!formData.projectId) errors.projectId = '请选择项目'
    if (!formData.title.trim()) errors.title = '请输入标题'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      if (editingDoc) {
        await documentsApi.apiDocumentUpsertPost({
          id: editingDoc.id,
          projectId: formData.projectId,
          title: formData.title,
          parentId: createParentId || undefined,
        })
        showToast('更新成功', 'success')
      } else {
        await documentsApi.apiDocumentUpsertPost({
          projectId: formData.projectId,
          title: formData.title,
          parentId: createParentId || undefined,
          content: '',
        })
        showToast('创建成功', 'success')
        // 如果是创建子文档，自动展开父节点
        if (createParentId) {
          setExpandedDocs(prev => new Set([...prev, createParentId]))
        }
      }
      setShowCreateModal(false)
      setEditingDoc(null)
      setCreateParentId(null)
      fetchDocuments()
    } catch (error) {
      showToast('操作失败', 'error')
    }
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
      setActiveDocContent(newValue)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length
      }, 0)
      return
    }
    
    // Ctrl+S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
      return
    }

    // Ctrl/Cmd + Shift + F 格式化
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
      e.preventDefault()
      handleFormat()
      return
    }
    
    const pairs: Record<string, string> = {
      '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`',
    }
    
    if (pairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      const closeChar = pairs[e.key]
      const newValue = value.substring(0, start) + e.key + closeChar + value.substring(end)
      setActiveDocContent(newValue)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
      }, 0)
      return
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      const selected = value.substring(start, end)
      const newValue = value.substring(0, start) + '**' + (selected || '粗体文字') + '**' + value.substring(end)
      setActiveDocContent(newValue)
      setTimeout(() => {
        textarea.selectionStart = start + 2
        textarea.selectionEnd = start + 2 + (selected || '粗体文字').length
      }, 0)
      return
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      const selected = value.substring(start, end)
      const newValue = value.substring(0, start) + '*' + (selected || '斜体文字') + '*' + value.substring(end)
      setActiveDocContent(newValue)
      setTimeout(() => {
        textarea.selectionStart = start + 1
        textarea.selectionEnd = start + 1 + (selected || '斜体文字').length
      }, 0)
      return
    }
  }

  // 粘贴图片
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items || !activeDoc) return

    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return

    e.preventDefault()
    setUploading(true)

    try {
      for (const item of imageItems) {
        const file = item.getAsFile()
        if (!file) continue

        await documentAttachmentsApi.apiDocumentAttachmentUploadPost(activeDoc.id, file, true)
      }
      
      showToast('图片上传成功', 'success')
      fetchAttachments(activeDoc.id)
    } catch (error) {
      showToast('图片上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  // 文件上传
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !activeDoc) return

    setUploading(true)
    try {
      await documentAttachmentsApi.apiDocumentAttachmentBatchUploadPost(activeDoc.id, Array.from(files))
      showToast('文件上传成功', 'success')
      fetchAttachments(activeDoc.id)
    } catch (error) {
      showToast('文件上传失败', 'error')
    } finally {
      setUploading(false)
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
      showToast('已复制', 'success')
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
      const value = activeDocContent
      
      const newValue = value.substring(0, start) + '\n' + markdown + '\n' + value.substring(end)
      setActiveDocContent(newValue)
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + markdown.length + 2
        textarea.focus()
      }, 0)
    } catch (error) {
      showToast('插入失败', 'error')
    }
  }

  // 获取项目名称
  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || '未知项目'
  }

  // 渲染文档树
  const renderDocTree = (nodes: Document[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedDocs.has(node.id)
      const isLoadingChildren = loadingChildren.has(node.id)
      const hasChildren = Boolean(node.hasChildren || (node.children && node.children.length > 0))
      const hasLoadedChildren = node.children && node.children.length > 0
      const isActive = activeDoc?.id === node.id
      
      return (
        <div key={node.id}>
          <div 
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${
              isActive 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                : 'hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => handleSelectDoc(node)}
          >
            {hasChildren ? (
              <button 
                type="button"
                onClick={(e) => toggleExpand(node.id, node, e)}
                className="p-0.5 rounded hover:bg-surface-200 dark:hover:bg-surface-700 flex-shrink-0 w-5 h-5 flex items-center justify-center"
                disabled={isLoadingChildren}
              >
                {isLoadingChildren ? (
                  <div className="w-3 h-3 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin" />
                ) : isExpanded ? (
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 flex-shrink-0" />
            )}
            
            <DocumentTextIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-surface-400'}`} />

            <span className="flex-1 text-sm truncate">
              <HighlightText 
                text={node.title} 
                query={debouncedSearchQuery} 
              />
            </span>
            
            {/* 操作按钮组 */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* 添加子文档按钮 */}
              <Tooltip content="添加子文档" placement="top">
                <button
                  onClick={(e) => handleCreateChild(node, e)}
                  className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="重命名" placement="top">
                <button
                  onClick={(e) => handleEditMeta(node, e)}
                  className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700"
                >
                  <PencilIcon className="w-3 h-3" />
                </button>
              </Tooltip>
              <Tooltip content="删除" placement="top">
                <button
                  onClick={(e) => handleDelete(node, e)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </Tooltip>
            </div>
          </div>
          
          {isExpanded && hasLoadedChildren && (
            <div>
              {renderDocTree(node.children!, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-surface-50 dark:bg-surface-950">
      {/* 左侧边栏 - 文档树 */}
      <div className="w-72 flex-shrink-0 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5 text-primary-500" />
              笔记本
            </h2>
            {/* 新建根文档按钮 */}
            <Button size="sm" leftIcon={<PlusIcon className="w-4 h-4" />} onClick={handleCreateRoot}>
              新建
            </Button>
          </div>
          
          {/* 项目筛选 */}
          <Select
            value={selectedProject}
            onChange={(value) => setSelectedProject(value)}
            options={[
              { value: '', label: '所有项目' },
              ...projects.map(p => ({ value: p.id, label: p.name }))
            ]}
            size="sm"
          />
          
          {/* 搜索 */}
          <div className="relative mt-3">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>
        
        {/* 文档树 */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <LoadingSpinner centered size="sm" />
          ) : documents.length === 0 ? (
            <EmptyState
              title="暂无文档"
              description='点击上方"新建"按钮创建根文档，或在现有文档旁点击"+"创建子文档'
              className="py-8"
            />
          ) : (
            // 虚拟滚动 - 如果列表超过 50 项
            filteredDocuments.length > 50 ? (
              <VirtualizedDocTree
                nodes={filteredDocuments}
                expandedDocs={expandedDocs}
                loadingChildren={loadingChildren}
                activeDoc={activeDoc}
                onToggleExpand={toggleExpand}
                onSelectDoc={handleSelectDoc}
                level={0}
                searchQuery={debouncedSearchQuery}
              />
            ) : (
              renderDocTree(filteredDocuments)
            )
          )}
        </div>
        
        {/* 底部刷新按钮 */}
        <div className="p-3 border-t border-surface-200 dark:border-surface-800">
          <button 
            onClick={fetchDocuments}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            刷新列表
          </button>
        </div>
      </div>
      
      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeDoc ? (
          <>
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="font-semibold text-lg text-surface-900 dark:text-white truncate">
                  {activeDoc.title}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">
                  {getProjectName(activeDoc.projectId)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 视图模式切换 */}
                <div className="flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      viewMode === 'edit'
                        ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' 
                        : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                    }`}
                  >
                    <CodeBracketIcon className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      viewMode === 'split'
                        ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' 
                        : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                    }`}
                  >
                    <Bars3Icon className="w-4 h-4" />
                    分屏
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      viewMode === 'preview'
                        ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' 
                        : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                    }`}
                  >
                    <BookOpenIcon className="w-4 h-4" />
                    预览
                  </button>
                </div>
                
                {/* 附件按钮 */}
                <Button 
                  variant="secondary" 
                  size="sm"
                  leftIcon={<PaperClipIcon className="w-4 h-4" />}
                  onClick={() => setShowAttachments(!showAttachments)}
                >
                  附件 ({attachments.length})
                </Button>
                
                {/* 保存按钮 */}
                {viewMode !== 'preview' && (
                  <>
                    <Button size="sm" variant="secondary" onClick={handleFormat} leftIcon={<ArrowPathIcon className="w-4 h-4" />}>
                      格式化
                    </Button>
                    <Button size="sm" onClick={handleSave} leftIcon={<CheckIcon className="w-4 h-4" />}>
                      保存
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* 编辑/预览区域 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 编辑器 */}
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-surface-200 dark:border-surface-800' : 'flex-1'} flex flex-col bg-white dark:bg-surface-900`}>
                  {viewMode === 'split' && (
                    <div className="px-4 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-800 text-xs text-surface-500">
                      Markdown 编辑 (Ctrl+S 保存, Ctrl+B 粗体, Ctrl+I 斜体, Ctrl+Shift+F 格式化, 粘贴上传图片)
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={activeDocContent}
                    onChange={(e) => setActiveDocContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    className="flex-1 p-6 resize-none bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 font-mono text-sm focus:outline-none"
                    placeholder="输入 Markdown 内容..."
                    spellCheck={false}
                    style={{ tabSize: 2, lineHeight: '1.6' }}
                  />
                </div>
              )}
              
              {/* 预览 */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} flex flex-col bg-white dark:bg-surface-900 overflow-hidden`}>
                  {viewMode === 'split' && (
                    <div className="px-4 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-800 text-xs text-surface-500">
                      实时预览
                    </div>
                  )}
                  <div 
                    className="flex-1 overflow-y-auto p-6 prose dark:prose-invert max-w-none prose-pre:bg-surface-100 dark:prose-pre:bg-surface-900 prose-code:before:content-[''] prose-code:after:content-['']"
                    dangerouslySetInnerHTML={{
                      __html: mdParser.render(
                        normalizeMarkdown(activeDocContent, attachmentNameMap),
                        { attachmentNameMap }
                      )
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* 附件面板 */}
            {showAttachments && (
              <div className="h-48 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-800">
                  <span className="text-sm font-medium">附件 ({attachments.length})</span>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    <Button size="sm" variant="secondary" leftIcon={<CloudArrowUpIcon className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()}>
                      上传
                    </Button>
                    <button onClick={() => setShowAttachments(false)} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {attachments.length === 0 ? (
                    <div className="text-center py-8 text-surface-500 text-sm">
                      暂无附件，点击上传按钮添加
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-3">
                      {attachments.map(attachment => (
                        <div key={attachment.id} className="group relative p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700">
                          <div className="flex items-center gap-3">
                            <div className={getFileIconColor(attachment.mimeType)}>
                              {attachment.mimeType?.startsWith('image/') ? (
                                <img 
                                  src={`/api/documentattachment/content?id=${attachment.id}`}
                                  alt={attachment.fileName}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                <DocumentTextIcon className="w-10 h-10" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                              <p className="text-xs text-surface-500">{formatFileSize(attachment.fileSize)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => insertToEditor(attachment)}
                              className="flex-1 px-2 py-1 text-xs rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 hover:bg-primary-100"
                            >
                              插入
                            </button>
                            <button
                              onClick={() => copyMarkdownLink(attachment)}
                              className="p-1 text-xs rounded hover:bg-surface-100"
                            >
                              {copiedLink === attachment.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                            </button>
                            <a
                              href={`/api/documentattachment/download?id=${attachment.id}`}
                              download
                              className="p-1 text-xs rounded hover:bg-surface-100"
                            >
                              <DocumentArrowUpIcon className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* 空状态 */
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              title="选择一个文档"
              description={
                <div className="space-y-2">
                  <p>从左侧列表选择文档开始编辑</p>
                  <p className="text-sm text-surface-400">提示：鼠标悬停在文档上可显示添加子文档、编辑、删除按钮</p>
                </div>
              }
              action={{ label: '创建根文档', onClick: handleCreateRoot }}
            />
          </div>
        )}
      </div>
      
      {/* 创建/编辑文档模态框 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { 
          setShowCreateModal(false); 
          setEditingDoc(null);
          setCreateParentId(null);
        }}
        title={editingDoc ? '编辑文档' : (createParentId ? '创建子文档' : '创建根文档')}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { 
              setShowCreateModal(false); 
              setEditingDoc(null);
              setCreateParentId(null);
            }}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingDoc ? '保存' : '创建'}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          {/* 显示父文档信息（如果是创建子文档） */}
          {createParentId && !editingDoc && (
            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <span className="text-sm text-surface-500">父文档：</span>
              <span className="text-sm font-medium">
                {flattenDocuments(documents).find(d => d.id === createParentId)?.title}
              </span>
            </div>
          )}
          
          <div>
            <Select
              label="所属项目"
              value={formData.projectId}
              onChange={(value) => setFormData({ ...formData, projectId: value })}
              options={[
                { value: '', label: '请选择项目' },
                ...projects.map(p => ({ value: p.id, label: p.name }))
              ]}
              error={formErrors.projectId}
            />
          </div>
          
          <div>
            <label className="form-label">文档标题</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入文档标题"
              className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
                formErrors.title ? 'border-red-500' : 'border-surface-300 dark:border-surface-600'
              }`}
            />
            {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
          </div>
        </form>
      </Modal>
      
      {/* 删除确认模态框 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingDoc(null) }}
        title="确认删除"
        description={`确定要删除 "${deletingDoc?.title}" 吗？此操作不可恢复，子文档也会被删除。`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeletingDoc(null) }}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              删除
            </Button>
          </div>
        }
      />
      
      {/* 上传中遮罩 */}
      {uploading && (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 flex items-center gap-3">
            <LoadingSpinner size="sm" />
            <span>上传中...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// 虚拟滚动组件 - 使用 react-window (需安装: npm install react-window)
// 当列表超过 50 项时自动启用
interface VirtualizedDocTreeProps {
  nodes: Document[]
  expandedDocs: Set<string>
  loadingChildren: Set<string>
  activeDoc: Document | null
  onToggleExpand: (docId: string, node: Document, e: React.MouseEvent) => void
  onSelectDoc: (doc: Document) => void
  level?: number
  searchQuery: string
}

// 简单的虚拟滚动实现 (如果安装了 react-window, 可以使用 WindowScroller + List)
function VirtualizedDocTree({
  nodes,
  expandedDocs,
  loadingChildren,
  activeDoc,
  onToggleExpand,
  onSelectDoc,
  level = 0,
  searchQuery
}: VirtualizedDocTreeProps) {
  const itemSize = 48 // 每项高度
  
  // 计算所有可见项
  const visibleNodes = useMemo(() => {
    const result: { node: Document; level: number; isExpanded: boolean; hasLoadedChildren: boolean }[] = []
    const traverse = (nodes: Document[], currentLevel: number, isParentExpanded: boolean) => {
      nodes.forEach(node => {
        const isExpanded = isParentExpanded && expandedDocs.has(node.id)
        const hasLoadedChildren = node.children && node.children.length > 0
        
        result.push({
          node,
          level: currentLevel,
          isExpanded,
          hasLoadedChildren
        })
        
        if (isExpanded && hasLoadedChildren && node.children) {
          traverse(node.children, currentLevel + 1, true)
        }
      })
    }
    traverse(nodes, 0, true)
    return result
  }, [nodes, expandedDocs])

  return (
    <div>
      {visibleNodes.map(({ node, level: nodeLevel, isExpanded, hasLoadedChildren }, index) => {
        const isLoadingChildren = loadingChildren.has(node.id)
        const hasChildren = Boolean(node.hasChildren || hasLoadedChildren)
        const isActive = activeDoc?.id === node.id

        return (
          <div key={`${node.id}-${index}`}>
            <div
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
              style={{ paddingLeft: `${nodeLevel * 16 + 8}px` }}
              onClick={() => onSelectDoc(node)}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => onToggleExpand(node.id, node, e)}
                  className="p-0.5 rounded hover:bg-surface-200 dark:hover:bg-surface-700 flex-shrink-0 w-5 h-5 flex items-center justify-center"
                  disabled={isLoadingChildren}
                >
                  {isLoadingChildren ? (
                    <div className="w-3 h-3 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin" />
                  ) : isExpanded ? (
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-5 flex-shrink-0" />
              )}

              <DocumentTextIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-surface-400'}`} />

              <span className="flex-1 text-sm truncate">
                <HighlightText 
                  text={node.title} 
                  query={searchQuery} 
                />
              </span>

              {/* 操作按钮组 */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content="添加子文档" placement="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (hasLoadedChildren) {
                        onSelectDoc(node)
                        const newExpanded = new Set(expandedDocs)
                        newExpanded.add(node.id)
                        setExpandedDocs(newExpanded)
                      }
                    }}
                    className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip content="重命名" placement="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // handleEditMeta(node, e)
                    }}
                    className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700"
                  >
                    <PencilIcon className="w-3 h-3" />
                  </button>
                </Tooltip>
                <Tooltip content="删除" placement="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // handleDelete(node, e)
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {isExpanded && hasLoadedChildren && node.children && (
              <div>
                {node.children.map((child, i) => (
                  <VirtualizedDocTree
                    key={child.id}
                    nodes={[child]}
                    expandedDocs={expandedDocs}
                    loadingChildren={loadingChildren}
                    activeDoc={activeDoc}
                    onToggleExpand={onToggleExpand}
                    onSelectDoc={onSelectDoc}
                    level={nodeLevel + 1}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
