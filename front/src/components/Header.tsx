import React, { useState } from 'react'
import clsx from 'clsx'
import { 
  SunIcon, 
  MoonIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  HomeIcon
} from '@heroicons/react/24/solid'
import { Button } from './Button'
import { Tooltip } from './Tooltip'
import { Route } from '../router'

interface User {
  id: string
  account: string
  name: string
  isSuper: boolean
}

type Props = {
  activeRoute: Route
  onToggleTheme: () => void
  onNavigate: (route: Route) => void
  isDark: boolean
  isAuthenticated: boolean
  user: User | null
  onLogout: () => void
}

const navItems: { label: string; route: Route; requireAuth?: boolean; icon: string }[] = [
  { label: '首页', route: 'home', icon: '🏠' },
  { label: '仪表盘', route: 'dashboard', requireAuth: true, icon: '📊' },
  { label: '用户', route: 'users', requireAuth: true, icon: '👥' },
  { label: '角色', route: 'roles', requireAuth: true, icon: '🛡️' },
  { label: '团队', route: 'teams', requireAuth: true, icon: '🤝' },
  { label: '项目', route: 'projects', requireAuth: true, icon: '📁' },
  { label: '文档', route: 'documents', requireAuth: true, icon: '📄' },
  { label: 'AI 助手', route: 'ai-supports', requireAuth: true, icon: '🤖' },
  { label: 'Git 凭据', route: 'git-credentials', requireAuth: true, icon: '🔑' },
  { label: '组件', route: 'components', icon: '🧩' },
]

export default function Header({ 
  activeRoute, 
  onToggleTheme, 
  onNavigate, 
  isDark, 
  isAuthenticated, 
  user, 
  onLogout 
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const visibleNavItems = navItems.filter(item => 
    !item.requireAuth || isAuthenticated
  )

  return (
    <header className="sticky top-0 z-30 glass border-b border-surface-200/60 dark:border-surface-700/60">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'home')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-glow">
                N
              </div>
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-surface-900 dark:text-white">Neuro Studio</div>
                <div className="text-xs text-surface-500 dark:text-surface-400">AI Knowledge + Docs</div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map(item => (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={clsx(
                  'px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  activeRoute === item.route
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
                )}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="切换主题"
              className={clsx(
                'p-2.5 rounded-xl transition-all duration-200',
                'hover:bg-surface-100 dark:hover:bg-surface-800',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
              )}
            >
              {isDark ? (
                <MoonIcon className="w-5 h-5 text-surface-400" />
              ) : (
                <SunIcon className="w-5 h-5 text-amber-500" />
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
                    'hover:bg-surface-100 dark:hover:bg-surface-800',
                    userMenuOpen && 'bg-surface-100 dark:bg-surface-800'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.[0] || user?.account?.[0] || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-surface-700 dark:text-surface-300">
                    {user?.name || user?.account}
                  </span>
                  <ChevronDownIcon className={clsx(
                    'w-4 h-4 text-surface-400 transition-transform duration-200',
                    userMenuOpen && 'rotate-180'
                  )} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-white dark:bg-surface-800 rounded-xl shadow-soft-xl border border-surface-200 dark:border-surface-700 z-20 animate-scale-in">
                      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                        <p className="text-sm font-medium text-surface-900 dark:text-white">
                          {user?.name || user?.account}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                          {user?.isSuper ? '超级管理员' : '普通用户'}
                        </p>
                      </div>
                      <div className="py-1">
                      <button
                          onClick={() => {
                            onNavigate('dashboard')
                            setUserMenuOpen(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        >
                          个人中心
                        </button>
                        <button
                          onClick={() => {
                            onLogout()
                            setUserMenuOpen(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          退出登录
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button onClick={() => onNavigate('login')}>
                登录
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              ) : (
                <Bars3Icon className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-surface-200 dark:border-surface-700 animate-fade-in">
            <div className="flex flex-col gap-1">
              {visibleNavItems.map(item => (
                <button
                  key={item.route}
                  onClick={() => {
                    onNavigate(item.route)
                    setMobileMenuOpen(false)
                  }}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    activeRoute === item.route
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                  )}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
