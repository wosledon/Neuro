import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Route } from '../router'
import Breadcrumb, { BreadcrumbItem } from './Breadcrumb'
import Tooltip from './Tooltip'
import { 
  HomeIcon,
  UsersIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  FolderIcon,
  DocumentTextIcon,
  CpuChipIcon,
  KeyIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  LockClosedIcon,
  ListBulletIcon,
  BuildingOfficeIcon,
  DocumentIcon,
  BookOpenIcon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  SwatchIcon
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
  acrylicEnabled: boolean
  onToggleAcrylic: () => void
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
  { label: '仪表盘', route: 'dashboard', icon: Squares2X2Icon, requireAuth: true },
  { 
    label: '系统管理', 
    route: 'tenants', 
    icon: Cog6ToothIcon,
    requireAuth: true,
    children: [
      { label: '租户管理', route: 'tenants', icon: BuildingOfficeIcon, requireAuth: true },
      { label: '团队管理', route: 'teams', icon: UserGroupIcon, requireAuth: true },
      { label: '用户管理', route: 'users', icon: UsersIcon, requireAuth: true },
      { label: '角色管理', route: 'roles', icon: ShieldCheckIcon, requireAuth: true },
      { label: '权限管理', route: 'permissions', icon: LockClosedIcon, requireAuth: true },
      { label: '菜单管理', route: 'menus', icon: ListBulletIcon, requireAuth: true },
    ]
  },
  { 
    label: '知识库', 
    route: 'documents', 
    icon: DocumentTextIcon,
    requireAuth: true,
    children: [
      { label: '项目管理', route: 'projects', icon: FolderIcon, requireAuth: true },
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

// 折叠状态下的子菜单弹窗组件
interface CollapsedSubMenuProps {
  item: MenuItem
  isActive: (route: Route) => boolean
  isGroupActive: (item: MenuItem) => boolean
  onNavigate: (route: Route) => void
  isAuthenticated: boolean
}

function CollapsedSubMenu({ item, isActive, isGroupActive, onNavigate, isAuthenticated }: CollapsedSubMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const groupActive = isGroupActive(item)
  const Icon = item.icon

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 如果没有子菜单，直接渲染带 Tooltip 的按钮
  if (!item.children || item.children.length === 0) {
    return (
      <Tooltip content={item.label} placement="left">
        <button
          onClick={() => onNavigate(item.route)}
          className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors ${
            isActive(item.route)
              ? 'bg-primary-500 text-white'
              : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
      </Tooltip>
    )
  }

  // 有子菜单的情况
  const filteredChildren = item.children.filter(child => !child.requireAuth || isAuthenticated)

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Tooltip content={item.label} placement="left">
        <button
          className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors ${
            groupActive
              ? 'bg-primary-500 text-white'
              : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
      </Tooltip>

      {/* 子菜单弹窗 */}
      {isOpen && (
        <div 
          className="fixed left-16 top-auto ml-2 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-2 z-[100] animate-fade-in"
          style={{ marginTop: '-40px' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="px-3 py-2 border-b border-surface-200 dark:border-surface-700 mb-1">
            <span className="font-medium text-surface-900 dark:text-white text-sm">{item.label}</span>
          </div>
          {filteredChildren.map(child => {
            const ChildIcon = child.icon
            return (
              <button
                key={child.route}
                onClick={() => {
                  onNavigate(child.route)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-lg transition-colors text-left ${
                  isActive(child.route)
                    ? 'bg-primary-500 text-white'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
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

// 切换开关组件
interface ToggleSwitchProps {
  enabled: boolean
  onToggle: () => void
  label: string
  icon: React.ReactNode
}

function ToggleSwitch({ enabled, onToggle, label, icon }: ToggleSwitchProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
      }`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </div>
    </button>
  )
}

// 用户下拉菜单组件
interface UserDropdownProps {
  user: User
  isDark: boolean
  acrylicEnabled: boolean
  onToggleTheme: () => void
  onToggleAcrylic: () => void
  onNavigate: (route: Route) => void
  onLogout: () => void
}

function UserDropdown({ user, isDark, acrylicEnabled, onToggleTheme, onToggleAcrylic, onNavigate, onLogout }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
          isOpen 
            ? 'bg-surface-100 dark:bg-surface-800' 
            : 'hover:bg-surface-100 dark:hover:bg-surface-800'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-medium">
          {user.name?.[0] || user.account[0]}
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-sm font-medium text-surface-900 dark:text-white leading-tight">
            {user.name || user.account}
          </div>
          <div className="text-xs text-surface-500">
            {user.isSuper ? '超级管理员' : '普通用户'}
          </div>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 py-2 bg-white dark:bg-surface-800 rounded-xl shadow-soft-xl border border-surface-200 dark:border-surface-700 z-50 animate-scale-in">
          {/* 用户信息 */}
          <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <p className="text-sm font-medium text-surface-900 dark:text-white">
              {user.name || user.account}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {user.isSuper ? '超级管理员' : '普通用户'}
            </p>
          </div>

          {/* 设置项 */}
          <div className="py-1">
            {/* 亚克力效果开关 */}
            <ToggleSwitch
              enabled={acrylicEnabled}
              onToggle={() => {
                onToggleAcrylic()
                setIsOpen(false)
              }}
              label="亚克力效果"
              icon={<SwatchIcon className="w-4 h-4 text-purple-500" />}
            />

            {/* 主题切换 */}
            <ToggleSwitch
              enabled={isDark}
              onToggle={() => {
                onToggleTheme()
                setIsOpen(false)
              }}
              label={isDark ? '暗色模式' : '亮色模式'}
              icon={isDark ? <MoonIcon className="w-4 h-4 text-indigo-500" /> : <SunIcon className="w-4 h-4 text-amber-500" />}
            />

            <div className="my-1 border-t border-surface-200 dark:border-surface-700" />

            {/* 个人设置 */}
            <button
              onClick={() => {
                onNavigate('profile')
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <Cog6ToothIcon className="w-4 h-4 text-surface-400" />
              个人设置
            </button>

            {/* 退出登录 */}
            <button
              onClick={() => {
                onLogout()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Layout({ 
  children,
  activeRoute, 
  onNavigate, 
  onToggleTheme, 
  isDark, 
  isAuthenticated, 
  user, 
  onLogout,
  acrylicEnabled,
  onToggleAcrylic
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
  const isGroupActive = useCallback((item: MenuItem): boolean => {
    if (!item.children) return false
    return item.children.some(child => child.route === activeRoute)
  }, [activeRoute])

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

  // 根据亚克力效果状态决定使用的样式类
  const sidebarClass = acrylicEnabled 
    ? 'acrylic-sidebar' 
    : 'bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800'
  
  const headerClass = acrylicEnabled 
    ? 'acrylic-header' 
    : 'bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800'

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
        className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarClass}`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center ${acrylicEnabled ? 'border-b border-white/20 dark:border-surface-700/30' : 'border-b border-surface-200 dark:border-surface-800'} ${
          sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                  N
                </div>
                <span className="font-bold text-surface-900 dark:text-white">Neuro</span>
              </div>
              <Tooltip content="折叠菜单" placement="bottom">
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex p-1.5 rounded-lg hover:bg-surface-100/50 dark:hover:bg-surface-800/50 text-surface-500 transition-colors"
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
              </Tooltip>
            </>
          ) : (
            <div className="flex items-center justify-center">
              <Tooltip content="展开菜单" placement="right">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold hover:opacity-90 transition-opacity"
                >
                  N
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`space-y-1 overflow-y-auto h-[calc(100vh-4rem)] ${
          sidebarCollapsed ? 'p-2' : 'p-2'
        }`}>
          {sidebarCollapsed ? (
            // 折叠状态：使用 Tooltip 和子菜单弹窗
            filteredMenuItems.map((item) => (
              <CollapsedSubMenu
                key={item.label}
                item={item}
                isActive={isActive}
                isGroupActive={isGroupActive}
                onNavigate={handleNavigate}
                isAuthenticated={isAuthenticated}
              />
            ))
          ) : (
            // 展开状态：正常显示
            filteredMenuItems.map((item) => {
              const Icon = item.icon
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedGroups.includes(item.label)
              const groupActive = isGroupActive(item)

              if (hasChildren) {
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        groupActive 
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50/80 dark:bg-primary-900/20' 
                          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100/50 dark:hover:bg-surface-800/50'
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
                                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100/50 dark:hover:bg-surface-800/50'
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

              return (
                <button
                  key={item.route}
                  onClick={() => handleNavigate(item.route)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.route)
                      ? 'bg-primary-500 text-white'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100/50 dark:hover:bg-surface-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main 
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Mobile Header */}
        <div className={`lg:hidden h-16 flex items-center justify-between px-4 sticky top-0 z-30 ${headerClass}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-surface-100/50 dark:hover:bg-surface-800/50"
            >
              <Bars3Icon className="w-6 h-6 text-surface-600 dark:text-surface-400" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
              N
            </div>
            <span className="font-bold text-surface-900 dark:text-white">Neuro</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 移动端主题切换 */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg hover:bg-surface-100/50 dark:hover:bg-surface-800/50 text-surface-600 dark:text-surface-400"
            >
              {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            
            {user && (
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                {user.name?.[0] || user.account[0]}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <div className={`hidden lg:flex h-16 items-center justify-between px-6 sticky top-0 z-30 ${headerClass}`}>
          <Breadcrumb items={breadcrumbItems} onNavigate={handleNavigate} />
          
          {/* 右侧：主题切换 + 用户下拉 */}
          <div className="flex items-center gap-4">
            {/* 用户下拉菜单（包含主题切换和亚克力效果开关） */}
            {user && (
              <UserDropdown
                user={user}
                isDark={isDark}
                acrylicEnabled={acrylicEnabled}
                onToggleTheme={onToggleTheme}
                onToggleAcrylic={onToggleAcrylic}
                onNavigate={handleNavigate}
                onLogout={onLogout}
              />
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
