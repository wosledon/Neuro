import React from 'react'
import clsx from 'clsx'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'
import Button from './Button'

type Route = 'components' | 'home' | 'login'

type Props = {
  activeRoute: Route
  onToggleTheme: () => void
  onNavigate: (route: Route) => void
  isDark: boolean
}

const navItems: { label: string; route: Route }[] = [
  { label: '首页', route: 'home' },
  { label: '组件', route: 'components' }
]

function ButtonLink({ label, onClick }: { label: string; onClick: () => void }){
  return (
    <Button variant="secondary" className="rounded-full" onClick={onClick}>
      {label}
    </Button>
  )
}

export default function Header({ activeRoute, onToggleTheme, onNavigate, isDark }: Props){
  return (
    <header className="w-full bg-transparent border-b border-gray-200/60 dark:border-gray-800/60 sticky top-0 z-30 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between py-4 px-2">
        <div className="flex items-center gap-4">
          <img src="/assets/logo.png" alt="logo" className="w-10 h-10 rounded-2xl shadow-lg" />
          <div>
            <div className="text-lg font-semibold">Neuro Studio</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">AI Knowledge + Docs</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-3">
            {navItems.map(item => (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={clsx('px-4 py-2 rounded-full transition', {
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
          <ButtonLink label="登录" onClick={() => onNavigate('login')} />
        </div>
      </div>
    </header>
  )
}
