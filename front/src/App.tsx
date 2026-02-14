import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RouterProvider, RouteRenderer, useRouter } from './router'
import Layout from './components/Layout'
import { useToast } from './components/ToastProvider'
import { LoadingSpinner } from './components'

function AppContent(){
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
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
    <AuthProvider>
      <RouterProvider>
        <AppInner darkMode={darkMode} setDarkMode={setDarkMode} />
      </RouterProvider>
    </AuthProvider>
  )
}

function AppInner({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) {
  const { route, navigate } = useRouter()
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const { show: showToast } = useToast()
  const isLoginPage = route === 'login'

  const handleLogout = async () => {
    try {
      await logout()
      showToast('已退出登录', 'success')
      navigate('login')
    } catch (error) {
      showToast('退出失败', 'error')
    }
  }

  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <LoadingSpinner text="验证身份..." />
      </div>
    )
  }

  // Login page without layout
  if (isLoginPage) {
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
    >
      <RouteRenderer />
    </Layout>
  )
}

export default function App(){
  return <AppContent />
}
