import React from 'react'
import clsx from 'clsx'
import { SunIcon, MoonIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import Button from './Button'
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

const navItems: { label: string; route: Route; requireAuth?: boolean }[] = [
  { label: '首页', route: 'dashboard', requireAuth: true },
  { label: '用户', route: 'users', requireAuth: true },
  { label: '角色', route: 'roles', requireAuth: true },
  { label: '团队', route: 'teams', requireAuth: true },
  { label: '项目', route: 'projects', requireAuth: true },
  { label: '文档', route: 'documents', requireAuth: true },
  { label: '组件', route: 'components' },
]

export default function Header({ activeRoute, onToggleTheme, onNavigate, isDark, isAuthenticated, user, onLogout }: Props){
  const visibleNavItems = navItems.filter(item => 
    !item.requireAuth || isAuthenticated
  )

  return (
    <header className="w-full bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/60 dark:border-gray-700/60 sticky top-0 z-30 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between py-4 px-2">
        <div className="flex items-center gap-4">
          <img src="/assets/logo.png" alt="logo" className="w-10 h-10 rounded-2xl shadow-lg" />
          <div>
            <div className="text-lg font-semibold">Neuro Studio</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">AI Knowledge + Docs</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-2">
            {visibleNavItems.map(item => (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={clsx('px-3 py-2 rounded-full text-sm transition', {
                  'bg-indigo-600 text-white shadow-lg': activeRoute === item.route,
                  'text-gray-600 hover:text-indigo-600 dark:text-gray-300': activeRoute !== item.route
                })}
              >
                {item.label}
              </button>
            ))}
          </nav>
          
          <button
            onClick={onToggleTheme}
            aria-label="切换主题"
            className="p-2 rounded-full bg-white/70 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 transition"
          >
            {isDark ? (
              <MoonIcon className="w-5 h-5 text-gray-200 theme-icon" />
            ) : (
              <SunIcon className="w-5 h-5 text-yellow-400 theme-icon" />
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                <UserCircleIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">{user?.name || user?.account}</span>
                {user?.isSuper && (
                  <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">超管</span>
                )}
              </div>
              <Button variant="secondary" className="text-sm px-3 py-1.5" onClick={onLogout}>
                退出
              </Button>
            </div>
          ) : (
            <Button variant="primary" className="rounded-full" onClick={() => onNavigate('login')}>
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
