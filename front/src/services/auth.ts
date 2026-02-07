import { Configuration, AuthApi, UserApi, RoleApi, PermissionApi, TeamApi, ProjectApi, DocumentApi } from './api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5146'

const config = new Configuration({
  basePath: API_BASE_URL,
})

// 创建 API 实例
export const authApi = new AuthApi(config)
export const usersApi = new UserApi(config)
export const rolesApi = new RoleApi(config)
export const permissionsApi = new PermissionApi(config)
export const teamsApi = new TeamApi(config)
export const projectsApi = new ProjectApi(config)
export const documentsApi = new DocumentApi(config)

// 请求拦截器：自动添加 token
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const [url, options = {}] = args
  const token = localStorage.getItem('access_token')
  
  if (token && typeof url === 'string' && url.startsWith(API_BASE_URL)) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    }
  }
  
  const response = await originalFetch(url, options)
  
  // 处理 401 未授权
  if (response.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
  }
  
  return response
}

// 登录响应类型
export interface LoginResult {
  accessToken: string
  refreshToken: string
}

// 登录
export async function login(account: string, password: string): Promise<LoginResult> {
  const response = await authApi.apiAuthLoginPost({
    loginRequest: { account, password }
  })
  const data = response.data.data as any
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  }
}

// 注册
export async function register(account: string, password: string, name?: string, email?: string) {
  await authApi.apiAuthRegisterPost({
    registerRequest: { account, password, name, email }
  })
}

// 刷新 token
export async function refreshToken(refreshToken: string): Promise<LoginResult> {
  const response = await authApi.apiAuthRefreshPost({
    loginResponse: { refreshToken } as any
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
    loginResponse: { refreshToken } as any
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
