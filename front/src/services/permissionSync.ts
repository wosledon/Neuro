import { adminApi } from './auth'

// 前端菜单项定义
export interface FrontendMenuItem {
  code: string
  name: string
  url?: string
  icon?: string
  sort: number
  children?: FrontendMenuItem[]
}

// 权限同步结果
export interface PermissionSyncResult {
  added: number
  updated: number
  removed: number
  permissions: string[]
}

// 菜单同步结果
export interface MenuSyncResult {
  added: number
  updated: number
  unchanged: number
  errors: string[]
}

/**
 * 扫描前端路由并生成菜单配置
 * 这个函数扫描所有前端路由配置，生成可供后端同步的菜单结构
 */
export function scanFrontendMenus(): FrontendMenuItem[] {
  // 前端菜单配置 - 与 Layout.tsx 中的 menuItems 保持一致
  const menus: FrontendMenuItem[] = [
    {
      code: 'home',
      name: '首页',
      url: '/home',
      icon: 'HomeIcon',
      sort: 0
    },
    {
      code: 'system',
      name: '系统管理',
      url: '/dashboard',
      icon: 'Squares2X2Icon',
      sort: 100,
      children: [
        {
          code: 'system:dashboard',
          name: '仪表盘',
          url: '/dashboard',
          icon: 'Squares2X2Icon',
          sort: 10
        },
        {
          code: 'system:tenants',
          name: '租户管理',
          url: '/tenants',
          icon: 'BuildingOfficeIcon',
          sort: 20
        }
      ]
    },
    {
      code: 'auth',
      name: '权限管理',
      url: '/users',
      icon: 'LockClosedIcon',
      sort: 200,
      children: [
        {
          code: 'auth:users',
          name: '用户管理',
          url: '/users',
          icon: 'UsersIcon',
          sort: 10
        },
        {
          code: 'auth:roles',
          name: '角色管理',
          url: '/roles',
          icon: 'ShieldCheckIcon',
          sort: 20
        },
        {
          code: 'auth:permissions',
          name: '权限管理',
          url: '/permissions',
          icon: 'LockClosedIcon',
          sort: 30
        },
        {
          code: 'auth:menus',
          name: '菜单管理',
          url: '/menus',
          icon: 'ListBulletIcon',
          sort: 40
        }
      ]
    },
    {
      code: 'org',
      name: '组织架构',
      url: '/teams',
      icon: 'UserGroupIcon',
      sort: 300,
      children: [
        {
          code: 'org:teams',
          name: '团队管理',
          url: '/teams',
          icon: 'UserGroupIcon',
          sort: 10
        },
        {
          code: 'org:projects',
          name: '项目管理',
          url: '/projects',
          icon: 'FolderIcon',
          sort: 20
        }
      ]
    },
    {
      code: 'knowledge',
      name: '知识库',
      url: '/documents',
      icon: 'DocumentTextIcon',
      sort: 400,
      children: [
        {
          code: 'knowledge:notebook',
          name: '笔记本',
          url: '/notebook',
          icon: 'BookOpenIcon',
          sort: 10
        },
        {
          code: 'knowledge:documents',
          name: '文档管理',
          url: '/documents',
          icon: 'DocumentTextIcon',
          sort: 20
        },
        {
          code: 'knowledge:file-resources',
          name: '文件资源',
          url: '/file-resources',
          icon: 'DocumentIcon',
          sort: 30
        }
      ]
    },
    {
      code: 'ai',
      name: 'AI 配置',
      url: '/ai-supports',
      icon: 'CpuChipIcon',
      sort: 500,
      children: [
        {
          code: 'ai:ai-supports',
          name: 'AI 助手',
          url: '/ai-supports',
          icon: 'CpuChipIcon',
          sort: 10
        },
        {
          code: 'ai:git-credentials',
          name: 'Git 凭据',
          url: '/git-credentials',
          icon: 'KeyIcon',
          sort: 20
        }
      ]
    }
  ]

  return menus
}

/**
 * 同步权限（自动扫描后端接口权限）
 * 只有超管可以调用
 */
export async function syncPermissions(): Promise<PermissionSyncResult> {
  const response = await adminApi.apiAdminSyncPermissionsPost()
  return response.data.data as PermissionSyncResult
}

/**
 * 同步菜单（前端上报菜单结构到后端）
 * 只有超管可以调用
 */
export async function syncMenus(menus?: FrontendMenuItem[]): Promise<MenuSyncResult> {
  const menusToSync = menus || scanFrontendMenus()
  const response = await adminApi.apiAdminSyncMenusPost(menusToSync as any)
  return response.data.data as MenuSyncResult
}

/**
 * 一键同步权限和菜单
 * 超管登录后可以调用此函数完成所有同步
 */
export async function syncAll(): Promise<{
  permissions: PermissionSyncResult
  menus: MenuSyncResult
}> {
  const [permissions, menus] = await Promise.all([
    syncPermissions(),
    syncMenus()
  ])
  
  return { permissions, menus }
}

/**
 * 预览权限（不保存）
 */
export async function previewPermissions(): Promise<string[]> {
  const response = await adminApi.apiAdminPreviewPermissionsGet()
  return (response.data.data as any).permissions as string[]
}
