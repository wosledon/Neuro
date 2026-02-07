import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RouterProvider, RouteRenderer, useRouter } from './router'
import Header from './components/Header'
import { useToast } from './components/ToastProvider'

function AppContent(){
  const [darkMode, setDarkMode] = useState<boolean>(()=>{
    try{ return localStorage.getItem('theme') === 'dark' }catch{ return false }
  })
  
  useEffect(()=>{
    const root = document.documentElement
    if(darkMode) root.classList.add('dark')
    else root.classList.remove('dark')
    try{ localStorage.setItem('theme', darkMode ? 'dark' : 'light') }catch{}
  },[darkMode])

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
  const { isAuthenticated, user, logout } = useAuth()
  const { showToast } = useToast()
  const isFullScreen = route === 'login'

  const handleLogout = async () => {
    try {
      await logout()
      showToast('已退出登录', 'success')
      navigate('login')
    } catch (error) {
      showToast('退出失败', 'error')
    }
  }

  const baseClasses = `min-h-screen text-gray-900 dark:text-gray-100 ${isFullScreen ? 'bg-slate-950' : 'bg-gray-50 dark:bg-gray-900'}`

  return (
    <div className={baseClasses}>
      {!isFullScreen && (
        <Header
          activeRoute={route}
          onNavigate={(next) => navigate(next)}
          onToggleTheme={() => setDarkMode(!darkMode)}
          isDark={darkMode}
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
        />
      )}
      {isFullScreen ? (
        <RouteRenderer />
      ) : (
        <div className="page-content container mx-auto">
          <main className="space-y-10">
            <div key={route} className="transition-opacity duration-300 ease-in-out page-enter page-enter-active">
              <RouteRenderer />
            </div>
          </main>
        </div>
      )}
    </div>
  )
}

export default function App(){
  return <AppContent />
}
