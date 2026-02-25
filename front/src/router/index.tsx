import React from 'react'
import { useAuth } from '../contexts/AuthContext'

// 页面组件
import Login from '../pages/Login'
import Chat from '../pages/Chat'
import Dashboard from '../pages/Dashboard'
import LandingPage from '../pages/LandingPage'
import Profile from '../pages/Profile'
import UserManagement from '../pages/admin/UserManagement'
import RoleManagement from '../pages/admin/RoleManagement'
import PermissionManagement from '../pages/admin/PermissionManagement'
import MenuManagement from '../pages/admin/MenuManagement'
import TeamManagement from '../pages/admin/TeamManagement'
import ProjectManagement from '../pages/admin/ProjectManagement'
import DocumentManagement from '../pages/admin/DocumentManagement'
import Notebook from '../pages/Notebook'
import FileResourceManagement from '../pages/admin/FileResourceManagement'
import TenantManagement from '../pages/admin/TenantManagement'
import AISupportManagement from '../pages/admin/AISupportManagement'
import GitCredentialManagement from '../pages/admin/GitCredentialManagement'
import ComponentsPage from '../pages/ComponentsPage'
import NotFound from '../pages/NotFound'
import { LoadingSpinner } from '../components'

export type Route = 
  | 'home'
  | 'login'
  | 'landing'
  | 'dashboard'
  | 'profile'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'menus'
  | 'teams'
  | 'projects'
  | 'documents'
  | 'notebook'
  | 'file-resources'
  | 'tenants'
  | 'ai-supports'
  | 'git-credentials'
  | 'components'

interface RouterContextType {
  route: Route
  navigate: (route: Route) => void
}

const RouterContext = React.createContext<RouterContextType | undefined>(undefined)

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = React.useState<Route>(() => {
    const saved = localStorage.getItem('current_route')
    // 默认显示介绍页
    return (saved as Route) || 'landing'
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
  const router = useRouter()
  const navigate = router?.navigate

  React.useEffect(() => {
    if (navigate && !isLoading && !isAuthenticated) {
      navigate('login')
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <LoadingSpinner size="lg" text="验证身份..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

// 公开路由守卫 - 已登录用户访问登录页时重定向
function PublicRoute({ children, redirectTo = 'home' }: { children: React.ReactNode; redirectTo?: Route }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const navigate = router?.navigate

  React.useEffect(() => {
    if (navigate && !isLoading && isAuthenticated) {
      navigate(redirectTo)
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <LoadingSpinner size="lg" text="正在跳转..." />
      </div>
    )
  }

  return <>{children}</>
}

// 路由渲染组件
export function RouteRenderer() {
  const { route, navigate } = useRouter()

  switch (route) {
    case 'home':
      return (
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      )
    case 'login':
      return (
        <PublicRoute>
          <Login 
            onBack={() => navigate('landing')} 
            onLogin={() => navigate('home')} 
          />
        </PublicRoute>
      )
    case 'landing':
      return <LandingPage />
    case 'dashboard':
      return (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )
    case 'profile':
      return (
        <ProtectedRoute>
          <Profile />
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
    case 'permissions':
      return (
        <ProtectedRoute>
          <PermissionManagement />
        </ProtectedRoute>
      )
    case 'menus':
      return (
        <ProtectedRoute>
          <MenuManagement />
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
    case 'file-resources':
      return (
        <ProtectedRoute>
          <FileResourceManagement />
        </ProtectedRoute>
      )
    case 'tenants':
      return (
        <ProtectedRoute>
          <TenantManagement />
        </ProtectedRoute>
      )
    case 'ai-supports':
      return (
        <ProtectedRoute>
          <AISupportManagement />
        </ProtectedRoute>
      )
    case 'git-credentials':
      return (
        <ProtectedRoute>
          <GitCredentialManagement />
        </ProtectedRoute>
      )
    case 'components':
      return <ComponentsPage />
    case 'notebook':
      return (
        <ProtectedRoute>
          <Notebook />
        </ProtectedRoute>
      )
    default:
      return <NotFound />
  }
}
