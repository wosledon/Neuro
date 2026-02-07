import React from 'react'
import { useAuth } from '../contexts/AuthContext'

// 页面组件
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import UserManagement from '../pages/admin/UserManagement'
import RoleManagement from '../pages/admin/RoleManagement'
import TeamManagement from '../pages/admin/TeamManagement'
import ProjectManagement from '../pages/admin/ProjectManagement'
import DocumentManagement from '../pages/admin/DocumentManagement'

export type Route = 
  | 'login'
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'teams'
  | 'projects'
  | 'documents'
  | 'components'

interface RouterContextType {
  route: Route
  navigate: (route: Route) => void
}

const RouterContext = React.createContext<RouterContextType | undefined>(undefined)

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = React.useState<Route>(() => {
    const saved = localStorage.getItem('current_route')
    return (saved as Route) || 'dashboard'
  })
  
  const navigate = React.useCallback((newRoute: Route) => {
    setRoute(newRoute)
    localStorage.setItem('current_route', newRoute)
  }, [])

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  const context = React.useContext(RouterContext)
  if (context === undefined) {
    throw new Error('useRouter must be used within a RouterProvider')
  }
  return context
}

// 路由守卫组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const { navigate } = useRouter()

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('login')
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

// 路由渲染组件
export function RouteRenderer() {
  const { route, navigate } = useRouter()
  const { isAuthenticated } = useAuth()

  // 已登录用户访问登录页，重定向到 dashboard
  if (route === 'login' && isAuthenticated) {
    navigate('dashboard')
    return null
  }

  switch (route) {
    case 'login':
      return <Login onBack={() => navigate('dashboard')} onLogin={() => navigate('dashboard')} />
    case 'dashboard':
      return (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )
    case 'users':
      return (
        <ProtectedRoute>
          <UserManagement />
        </ProtectedRoute>
      )
    case 'roles':
      return (
        <ProtectedRoute>
          <RoleManagement />
        </ProtectedRoute>
      )
    case 'teams':
      return (
        <ProtectedRoute>
          <TeamManagement />
        </ProtectedRoute>
      )
    case 'projects':
      return (
        <ProtectedRoute>
          <ProjectManagement />
        </ProtectedRoute>
      )
    case 'documents':
      return (
        <ProtectedRoute>
          <DocumentManagement />
        </ProtectedRoute>
      )
    default:
      return (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )
  }
}
