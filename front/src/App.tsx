import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RouterProvider, RouteRenderer, useRouter } from './router'
import Layout from './components/Layout'
import { useToast } from './components/ToastProvider'
import { LoadingSpinner, ErrorBoundary } from './components'
import { ExclamationCircleIcon } from '@heroicons/react/24/solid'

// 自定义错误降级 UI
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-surface-900 rounded-xl shadow-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl flex-shrink-0">
            <ExclamationCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              抱歉，页面出现了问题
            </h2>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-1">
                错误信息
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300 font-mono break-all">
                {error.toString()}
              </div>
            </div>
            
            <button
              onClick={resetError}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppContent(){
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // 亚克力效果状态
  const [acrylicEnabled, setAcrylicEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('acrylic')
    // 默认开启亚克力效果
    return saved !== null ? saved === 'true' : true
  })
  
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // 亚克力效果切换时更新 body 类名
  useEffect(() => {
    const root = document.documentElement
    if (acrylicEnabled) {
      root.classList.add('acrylic-mode')
    } else {
      root.classList.remove('acrylic-mode')
    }
    localStorage.setItem('acrylic', acrylicEnabled ? 'true' : 'false')
  }, [acrylicEnabled])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-2xl shadow-glow animate-pulse">
            N
          </div>
          <LoadingSpinner text="加载中..." />
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback resetError={() => window.location.reload()} />}>
      <AuthProvider>
        <RouterProvider>
          <AppInner
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            acrylicEnabled={acrylicEnabled}
            setAcrylicEnabled={setAcrylicEnabled}
          />
        </RouterProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

interface AppInnerProps {
  darkMode: boolean
  setDarkMode: (v: boolean) => void
  acrylicEnabled: boolean
  setAcrylicEnabled: (v: boolean) => void
}

function AppInner({ darkMode, setDarkMode, acrylicEnabled, setAcrylicEnabled }: AppInnerProps) {
  const { route, navigate } = useRouter()
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const { show: showToast } = useToast()
  const isLoginPage = route === 'login'
  const isLandingPage = route === 'landing'

  const handleLogout = async () => {
    try {
      await logout()
      showToast('已退出登录', 'success')
      navigate('landing')
    } catch (error) {
      showToast('退出失败', 'error')
    }
  }

  if (isLoading && !isLoginPage && !isLandingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <LoadingSpinner text="验证身份..." />
      </div>
    )
  }

  // Login page and landing page without layout
  if (isLoginPage || isLandingPage) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
        <RouteRenderer />
      </div>
    )
  }

  return (
    <Layout
      activeRoute={route}
      onNavigate={(next) => navigate(next)}
      onToggleTheme={() => setDarkMode(!darkMode)}
      isDark={darkMode}
      isAuthenticated={isAuthenticated}
      user={user}
      onLogout={handleLogout}
      acrylicEnabled={acrylicEnabled}
      onToggleAcrylic={() => setAcrylicEnabled(!acrylicEnabled)}
    >
      <RouteRenderer />
    </Layout>
  )
}

export default function App(){
  return <AppContent />
}
