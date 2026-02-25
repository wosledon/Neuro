import React from 'react'
import { useAuth } from '../contexts/AuthContext'

// 页面组件 - 懒加载
const Login = React.lazy(() => import('../pages/Login'))
const Chat = React.lazy(() => import('../pages/Chat'))
const Dashboard = React.lazy(() => import('../pages/Dashboard'))
const LandingPage = React.lazy(() => import('../pages/LandingPage'))
const Profile = React.lazy(() => import('../pages/Profile'))
const UserManagement = React.lazy(() => import('../pages/admin/UserManagement'))
const RoleManagement = React.lazy(() => import('../pages/admin/RoleManagement'))
const PermissionManagement = React.lazy(() => import('../pages/admin/PermissionManagement'))
const MenuManagement = React.lazy(() => import('../pages/admin/MenuManagement'))
const TeamManagement = React.lazy(() => import('../pages/admin/TeamManagement'))
const ProjectManagement = React.lazy(() => import('../pages/admin/ProjectManagement'))
const DocumentManagement = React.lazy(() => import('../pages/admin/DocumentManagement'))
const Notebook = React.lazy(() => import('../pages/Notebook'))
const FileResourceManagement = React.lazy(() => import('../pages/admin/FileResourceManagement'))
const TenantManagement = React.lazy(() => import('../pages/admin/TenantManagement'))
const AISupportManagement = React.lazy(() => import('../pages/admin/AISupportManagement'))
const GitCredentialManagement = React.lazy(() => import('../pages/admin/GitCredentialManagement'))
const ComponentsPage = React.lazy(() => import('../pages/ComponentsPage'))
const NotFound = React.lazy(() => import('../pages/NotFound'))
const LoadingSpinner = React.lazy(() => import('../components/LoadingSpinner'))

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

  // 加载状态组件
  const LoadingFallback = (
    <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  )

  switch (route) {
    case 'home':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <Chat />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'login':
      return (
        <PublicRoute>
          <React.Suspense fallback={LoadingFallback}>
            <Login
              onBack={() => navigate('landing')}
              onLogin={() => navigate('home')}
            />
          </React.Suspense>
        </PublicRoute>
      )
    case 'landing':
      return (
        <React.Suspense fallback={LoadingFallback}>
          <LandingPage />
        </React.Suspense>
      )
    case 'dashboard':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <Dashboard />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'profile':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <Profile />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'users':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <UserManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'roles':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <RoleManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'permissions':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <PermissionManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'menus':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <MenuManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'teams':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <TeamManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'projects':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <ProjectManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'documents':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <DocumentManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'file-resources':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <FileResourceManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'tenants':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <TenantManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'ai-supports':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <AISupportManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'git-credentials':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <GitCredentialManagement />
          </React.Suspense>
        </ProtectedRoute>
      )
    case 'components':
      return (
        <React.Suspense fallback={LoadingFallback}>
          <ComponentsPage />
        </React.Suspense>
      )
    case 'notebook':
      return (
        <ProtectedRoute>
          <React.Suspense fallback={LoadingFallback}>
            <Notebook />
          </React.Suspense>
        </ProtectedRoute>
      )
    default:
      return (
        <React.Suspense fallback={LoadingFallback}>
          <NotFound />
        </React.Suspense>
      )
  }
}
