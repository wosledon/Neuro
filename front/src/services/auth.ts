import { 
  Configuration, 
  AuthApi, 
  UserApi, 
  RoleApi, 
  PermissionApi, 
  TeamApi, 
  ProjectApi, 
  DocumentApi, 
  DocumentAttachmentApi,
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
  AdminApi,
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
export const documentAttachmentsApi = new DocumentAttachmentApi(config)
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

// Admin API
export const adminApi = new AdminApi(config)

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

// 重新导出权限同步相关函数
export * from './permissionSync'
