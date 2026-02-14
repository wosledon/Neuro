import { 
  Configuration, 
  AuthApi, 
  UserApi, 
  RoleApi, 
  PermissionApi, 
  TeamApi, 
  ProjectApi, 
  DocumentApi, 
  TeamProjectApi,
  RolePermissionApi,
  RoleMenuApi,
  RoleDocumentApi,
  UserRoleApi,
  UserTeamApi,
  UserDocumentApi,
  TeamDocumentApi,
  MenuApi,
  TenantApi,
  FileResourceApi,
  AISupportApi,
  GitCredentialApi,
  ProjectAISupportApi,
  ProjectGitCredentialApi,
  UserGitCredentialApi,
} from './api'
import globalAxios from 'axios'

// API 基础 URL 配置
// 开发环境：使用空字符串，让请求使用相对路径（通过 Vite 代理）
// 生产环境：使用环境变量或默认地址
const isDev = import.meta.env.DEV
const API_BASE_URL = isDev 
  ? ''  // 开发环境使用相对路径
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5146')

const config = new Configuration({
  basePath: API_BASE_URL,
})

// 创建 API 实例 - 基础 API
export const authApi = new AuthApi(config)
export const usersApi = new UserApi(config)
export const rolesApi = new RoleApi(config)
export const permissionsApi = new PermissionApi(config)
export const teamsApi = new TeamApi(config)
export const projectsApi = new ProjectApi(config)
export const documentsApi = new DocumentApi(config)
export const menusApi = new MenuApi(config)
export const tenantsApi = new TenantApi(config)
export const fileResourcesApi = new FileResourceApi(config)

// 创建 API 实例 - 关联表 API
export const teamProjectApi = new TeamProjectApi(config)
export const rolePermissionApi = new RolePermissionApi(config)
export const roleMenuApi = new RoleMenuApi(config)
export const roleDocumentApi = new RoleDocumentApi(config)
export const userRoleApi = new UserRoleApi(config)
export const userTeamApi = new UserTeamApi(config)
export const userDocumentApi = new UserDocumentApi(config)
export const teamDocumentApi = new TeamDocumentApi(config)
export const projectAISupportApi = new ProjectAISupportApi(config)
export const projectGitCredentialApi = new ProjectGitCredentialApi(config)
export const userGitCredentialApi = new UserGitCredentialApi(config)

// 新功能模块 API
export const aiSupportApi = new AISupportApi(config)
export const gitCredentialApi = new GitCredentialApi(config)

// 文档附件 API（自定义实现）
export const documentAttachmentsApi = {
  // 获取文档附件列表
  apiDocumentattachmentListGet: (documentId: string) => {
    return globalAxios.get(`/api/documentattachment/list?documentId=${documentId}`)
  },
  
  // 上传单个文件
  apiDocumentattachmentUploadPost: (formData: FormData) => {
    return globalAxios.post('/api/documentattachment/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // 批量上传文件
  apiDocumentattachmentBatchUploadPost: (formData: FormData) => {
    return globalAxios.post('/api/documentattachment/batch-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // 下载附件
  apiDocumentattachmentDownloadGet: (id: string) => {
    return globalAxios.get(`/api/documentattachment/download?id=${id}`, {
      responseType: 'blob'
    })
  },
  
  // 获取文件内容（图片预览等）
  apiDocumentattachmentContentGet: (id: string) => {
    return globalAxios.get(`/api/documentattachment/content?id=${id}`)
  },
  
  // 更新附件信息
  apiDocumentattachmentUpdatePost: (data: any) => {
    return globalAxios.post('/api/documentattachment/update', data)
  },
  
  // 删除附件
  apiDocumentattachmentDeletePost: (data: { ids: string[] }) => {
    return globalAxios.post('/api/documentattachment/delete', data)
  },
  
  // 获取Markdown链接
  apiDocumentattachmentMarkdownLinkGet: (id: string) => {
    return globalAxios.get(`/api/documentattachment/markdown-link?id=${id}`)
  }
}

// 扩展文档 API - 使用生成的 API 方法
export const extendedDocumentsApi = {
  // 原始方法代理
  apiDocumentListGet: (keyword?: string, page?: any, pageSize?: any) => documentsApi.apiDocumentListGet(keyword, page, pageSize),
  apiDocumentGetGet: (id?: string) => documentsApi.apiDocumentGetGet(id),
  apiDocumentUpsertPost: (body?: any) => documentsApi.apiDocumentUpsertPost(body),
  apiDocumentDeleteDelete: (body?: any) => documentsApi.apiDocumentDeleteDelete(body),
  
  // 获取文档树 - 使用生成的 apiDocumentGetTreeTreeGet
  apiDocumentTreeGet: (projectId?: string) => {
    return documentsApi.apiDocumentGetTreeTreeGet(projectId)
  },
  
  // 获取面包屑路径 - 使用生成的 apiDocumentGetBreadcrumbBreadcrumbGet
  apiDocumentBreadcrumbGet: (id: string) => {
    return documentsApi.apiDocumentGetBreadcrumbBreadcrumbGet(id)
  },
  
  // 移动文档 - 使用生成的 apiDocumentMoveMovePost
  apiDocumentMovePost: (data: { id: string; newParentId?: string | null; newSort?: number }) => {
    return documentsApi.apiDocumentMoveMovePost({
      id: data.id,
      newParentId: data.newParentId,
      newSort: data.newSort
    } as any)
  },
  
  // 批量移动文档 - 使用生成的 apiDocumentBatchMoveBatchMovePost
  apiDocumentBatchMovePost: (data: { documentIds: string[]; newParentId?: string | null; startSort?: number }) => {
    return documentsApi.apiDocumentBatchMoveBatchMovePost({
      documentIds: data.documentIds,
      newParentId: data.newParentId,
      startSort: data.startSort
    } as any)
  }
}

// Axios 请求拦截器：自动添加 token
globalAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    // 检查是否是 API 请求
    const isApiRequest = config.url?.startsWith('/api') || 
                        (!config.url?.startsWith('http') && token)
    if (token && isApiRequest) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Axios 响应拦截器：处理 401
globalAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 登录响应类型
export interface LoginResult {
  accessToken: string
  refreshToken: string
}

// 登录
export async function login(account: string, password: string): Promise<LoginResult> {
  try {
    const response = await authApi.apiAuthLoginPost({
      account, password
    })
    const data = response.data.data as any
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    }
  } catch (error: any) {
    console.error('Login error:', error)
    throw error
  }
}

// 注册
export async function register(account: string, password: string, name?: string, email?: string) {
  await authApi.apiAuthRegisterPost({
    account, password, name, email
  })
}

// 刷新 token
export async function refreshToken(refreshToken: string): Promise<LoginResult> {
  const response = await authApi.apiAuthRefreshPost({
    accessToken: '', refreshToken
  })
  const data = response.data.data as any
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  }
}

// 登出
export async function logout(refreshToken: string) {
  await authApi.apiAuthLogoutPost({
    accessToken: '', refreshToken
  })
}

// 获取当前用户信息
export async function getCurrentUser() {
  const response = await authApi.apiAuthMeGet()
  return response.data.data
}

// 获取当前用户权限
export async function getMyPermissions() {
  const response = await authApi.apiAuthPermissionsGet()
  return response.data.data as string[]
}

// 获取当前用户菜单
export async function getMyMenus() {
  const response = await authApi.apiAuthMenusGet()
  return response.data.data as any[]
}

// 检查权限
export async function checkPermission(code: string) {
  const response = await authApi.apiAuthCheckPermissionGet(code)
  return (response.data.data as any)?.hasPermission as boolean
}
