import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Route } from '../router'
import Breadcrumb, { BreadcrumbItem } from './Breadcrumb'
import { 
  HomeIcon,
  UsersIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  FolderIcon,
  DocumentTextIcon,
  CpuChipIcon,
  KeyIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  LockClosedIcon,
  ListBulletIcon,
  BuildingOfficeIcon,
  DocumentIcon,
  BookOpenIcon
} from '@heroicons/react/24/solid'

interface User {
  id: string
  account: string
  name: string
  isSuper: boolean
}

interface Props {
  children: React.ReactNode
  activeRoute: Route
  onNavigate: (route: Route) => void
  onToggleTheme: () => void
  isDark: boolean
  isAuthenticated: boolean
  user: User | null
  onLogout: () => void
}

interface MenuItem {
  label: string
  route: Route
  icon: React.ElementType
  requireAuth?: boolean
  children?: Omit<MenuItem, 'children'>[]
}

const menuItems: MenuItem[] = [
  { label: '首页', route: 'home', icon: HomeIcon },
  { 
    label: '系统管理', 
    route: 'dashboard', 
    icon: Squares2X2Icon,
    requireAuth: true,
    children: [
      { label: '仪表盘', route: 'dashboard', icon: Squares2X2Icon, requireAuth: true },
      { label: '租户管理', route: 'tenants', icon: BuildingOfficeIcon, requireAuth: true },
    ]
  },
  { 
    label: '权限管理', 
    route: 'users', 
    icon: LockClosedIcon,
    requireAuth: true,
    children: [
      { label: '用户管理', route: 'users', icon: UsersIcon, requireAuth: true },
      { label: '角色管理', route: 'roles', icon: ShieldCheckIcon, requireAuth: true },
      { label: '权限管理', route: 'permissions', icon: LockClosedIcon, requireAuth: true },
      { label: '菜单管理', route: 'menus', icon: ListBulletIcon, requireAuth: true },
    ]
  },
  { 
    label: '组织架构', 
    route: 'teams', 
    icon: UserGroupIcon,
    requireAuth: true,
    children: [
      { label: '团队管理', route: 'teams', icon: UserGroupIcon, requireAuth: true },
      { label: '项目管理', route: 'projects', icon: FolderIcon, requireAuth: true },
    ]
  },
  { 
    label: '知识库', 
    route: 'documents', 
    icon: DocumentTextIcon,
    requireAuth: true,
    children: [
      { label: '笔记本', route: 'notebook', icon: BookOpenIcon, requireAuth: true },
      { label: '文档管理', route: 'documents', icon: DocumentTextIcon, requireAuth: true },
      { label: '文件资源', route: 'file-resources', icon: DocumentIcon, requireAuth: true },
    ]
  },
  { 
    label: 'AI 配置', 
    route: 'ai-supports', 
    icon: CpuChipIcon,
    requireAuth: true,
    children: [
      { label: 'AI 助手', route: 'ai-supports', icon: CpuChipIcon, requireAuth: true },
      { label: 'Git 凭据', route: 'git-credentials', icon: KeyIcon, requireAuth: true },
    ]
  },
]

export default function Layout({ 
  children,
  activeRoute, 
  onNavigate, 
  onToggleTheme, 
  isDark, 
  isAuthenticated, 
  user, 
  onLogout 
}: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // 根据当前路由计算应该展开的菜单组
  const getExpandedGroups = useCallback((): string[] => {
    const groups: string[] = []
    for (const item of menuItems) {
      if (item.children?.some(child => child.route === activeRoute)) {
        groups.push(item.label)
      }
    }
    return groups.length > 0 ? groups : ['系统管理', '权限管理']
  }, [activeRoute])
  
  const [expandedGroups, setExpandedGroups] = useState<string[]>(getExpandedGroups)
  
  // 当路由变化时，自动展开对应的菜单组
  useEffect(() => {
    setExpandedGroups(prev => {
      const required = getExpandedGroups()
      // 合并已有的展开状态和必需的展开状态
      const merged = [...new Set([...prev, ...required])]
      return merged
    })
  }, [activeRoute, getExpandedGroups])

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    )
  }

  const isActive = (route: Route) => activeRoute === route
  
  // 判断菜单组是否处于激活状态（子菜单被选中）
  const isGroupActive = (item: MenuItem): boolean => {
    if (!item.children) return false
    return item.children.some(child => child.route === activeRoute)
  }

  // 生成面包屑数据
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    for (const item of menuItems) {
      // 直接匹配一级菜单
      if (item.route === activeRoute && !item.children) {
        return [{ label: item.label }]
      }
      // 匹配二级菜单
      if (item.children) {
        const child = item.children.find(c => c.route === activeRoute)
        if (child) {
          return [
            { label: item.label, route: item.route },
            { label: child.label }
          ]
        }
      }
    }
    return []
  }, [activeRoute])

  const handleNavigate = (route: Route) => {
    onNavigate(route)
    setMobileMenuOpen(false)
  }

  const filteredMenuItems = menuItems.filter(item => 
    !item.requireAuth || isAuthenticated
  )

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-200 dark:border-surface-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                N
              </div>
              <span className="font-bold text-surface-900 dark:text-white">Neuro</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold mx-auto">
              N
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedGroups.includes(item.label)
            const groupActive = isGroupActive(item)

            if (hasChildren && !sidebarCollapsed) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      groupActive 
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronDownIcon 
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.filter(child => !child.requireAuth || isAuthenticated).map(child => {
                        const ChildIcon = child.icon
                        return (
                          <button
                            key={child.route}
                            onClick={() => handleNavigate(child.route)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              isActive(child.route)
                                ? 'bg-primary-500 text-white'
                                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                            }`}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span className="text-sm">{child.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            // Single item or collapsed group
            if (sidebarCollapsed) {
              return (
                <button
                  key={item.route}
                  onClick={() => handleNavigate(item.route)}
                  className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive(item.route) || groupActive
                      ? 'bg-primary-500 text-white'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              )
            }

            return (
              <button
                key={item.route}
                onClick={() => handleNavigate(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.route)
                    ? 'bg-primary-500 text-white'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {isDark ? (
              <>
                <SunIcon className="w-5 h-5" />
                {!sidebarCollapsed && <span>切换亮色</span>}
              </>
            ) : (
              <>
                <MoonIcon className="w-5 h-5" />
                {!sidebarCollapsed && <span>切换暗色</span>}
              </>
            )}
          </button>
          
          {isAuthenticated && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              {!sidebarCollapsed && <span>退出登录</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <Bars3Icon className="w-6 h-6 text-surface-600 dark:text-surface-400" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
              N
            </div>
            <span className="font-bold text-surface-900 dark:text-white">Neuro</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                {user.name?.[0] || user.account[0]}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 items-center justify-between px-6 sticky top-0 z-30">
          <Breadcrumb items={breadcrumbItems} onNavigate={handleNavigate} />
          
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-surface-900 dark:text-white">{user.name || user.account}</div>
                <div className="text-xs text-surface-500">{user.isSuper ? '超级管理员' : '普通用户'}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                {user.name?.[0] || user.account[0]}
              </div>
            </div>
          )}
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
