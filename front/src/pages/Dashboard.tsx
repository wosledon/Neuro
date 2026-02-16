import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from '../router'
import { Card, StatCard, Button, Badge, LoadingSpinner } from '../components'
import { adminApi } from '../services/auth'
import { scanFrontendMenus } from '../services/permissionSync'
import { useToast } from '../components/ToastProvider'
import { useSystemStatusSignalR } from '../hooks/useSystemStatusSignalR'
import { useProjectDocSignalR, DocGenProgress } from '../hooks/useProjectDocSignalR'
import { projectsApi } from '../services/auth'
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  FolderIcon, 
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  ListBulletIcon,
  LockClosedIcon,
  CpuChipIcon,
  KeyIcon,
  DocumentIcon,
  BookOpenIcon,
  ArrowPathIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/solid'

// Activity item type
interface Activity {
  id: string
  type: 'user' | 'document' | 'project' | 'system'
  title: string
  description: string
  time: string
  user?: string
}

// System status type
interface SystemStatus {
  cpuUsage: number
  memoryUsage: number
  memoryUsed: number
  memoryTotal: number
  storageUsage: number
  storageUsed: number
  storageTotal: number
  uptime: string
}

// Project with doc gen status
interface ProjectWithDocGen {
  id: string
  name: string
  docGenStatus?: number
  docGenProgress?: DocGenProgress
}

// Activity icon component
function ActivityIcon({ type }: { type: Activity['type'] }) {
  const icons = {
    user: <UsersIcon className="w-5 h-5" />,
    document: <DocumentTextIcon className="w-5 h-5" />,
    project: <FolderIcon className="w-5 h-5" />,
    system: <SparklesIcon className="w-5 h-5" />,
  }

  const colors = {
    user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    document: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    project: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    system: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  }

  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[type]}`}>
      {icons[type]}
    </div>
  )
}

// Quick action type
interface QuickAction {
  key: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  route: string
}

// 统计数据类型
interface DashboardStats {
  users: number
  roles: number
  teams: number
  projects: number
  documents: number
  tenants: number
  menus: number
  permissions: number
  fileResources: number
}

export default function Dashboard() {
  const { user, menus } = useAuth()
  const { navigate } = useRouter()
  const { show: showToast } = useToast()
  const [greeting, setGreeting] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [showAllActions, setShowAllActions] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activityPagination, setActivityPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  })
  const [syncingPermissions, setSyncingPermissions] = useState(false)
  const [syncingMenus, setSyncingMenus] = useState(false)
  const [projectsWithDocGen, setProjectsWithDocGen] = useState<ProjectWithDocGen[]>([])
  
  // SignalR 回调函数使用 useCallback 避免重复创建
  const handleStatusUpdate = useCallback((newStatus: SystemStatus) => {
    console.log('收到实时系统状态:', newStatus)
  }, [])

  const handleSignalRError = useCallback((error: Error) => {
    console.error('SignalR 错误:', error)
  }, [])

  // 使用 SignalR 接收实时系统状态
  const { status: systemStatus, isConnected: signalRConnected } = useSystemStatusSignalR({
    onStatusUpdate: handleStatusUpdate,
    onError: handleSignalRError
  })

  // 获取项目列表并订阅文档生成进度
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.apiProjectListGet()
        const projects = (response.data.data as any[]) || []
        setProjectsWithDocGen(projects.map(p => ({
          id: p.id,
          name: p.name,
          docGenStatus: p.docGenStatus
        })))
      } catch (error) {
        console.error('获取项目列表失败:', error)
      }
    }
    fetchProjects()
  }, [])

  // 处理文档生成进度更新 - 使用函数式更新避免依赖问题
  const handleDocGenProgress = useCallback((progress: DocGenProgress) => {
    console.log('🔄 收到进度更新:', progress)
    setProjectsWithDocGen(prev => {
      const updated = prev.map(project => {
        // 确保 ID 比较时类型一致（都转为字符串）
        if (String(project.id) === String(progress.projectId)) {
          console.log('✅ 匹配到项目:', project.name, '更新进度:', progress.progress + '%')
          return {
            ...project,
            docGenStatus: progress.status,
            docGenProgress: progress
          }
        }
        return project
      })
      return updated
    })
  }, [])

  // 使用 SignalR 接收文档生成进度
  const { subscribeProject, unsubscribeProject } = useProjectDocSignalR({
    onProgress: handleDocGenProgress
  })

  // 订阅所有项目的文档生成进度
  useEffect(() => {
    const subscribeAll = async () => {
      console.log('📡 订阅项目进度:', projectsWithDocGen.map(p => p.id))
      for (const project of projectsWithDocGen) {
        await subscribeProject(project.id)
      }
    }
    subscribeAll()
    
    return () => {
      projectsWithDocGen.forEach(project => {
        unsubscribeProject(project.id)
      })
    }
  }, [projectsWithDocGen])

  // 同步权限
  const handleSyncPermissions = async () => {
    setSyncingPermissions(true)
    try {
      const response = await adminApi.apiAdminSyncPermissionsPost()
      const result = response.data.data as any
      showToast(`权限同步成功：新增 ${result.added} 个，更新 ${result.updated} 个`, 'success')
      // 刷新活动列表
      const activitiesResponse = await adminApi.apiAdminRecentActivitiesGet()
      setActivities(activitiesResponse.data.data as Activity[])
    } catch (error: any) {
      showToast('权限同步失败：' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setSyncingPermissions(false)
    }
  }

  // 同步菜单
  const handleSyncMenus = async () => {
    setSyncingMenus(true)
    try {
      const menus = scanFrontendMenus()
      const response = await adminApi.apiAdminSyncMenusPost(menus as any)
      const result = response.data.data as any
      showToast(`菜单同步成功：新增 ${result.added} 个，更新 ${result.updated} 个`, 'success')
      // 刷新活动列表
      const activitiesResponse = await adminApi.apiAdminRecentActivitiesGet()
      setActivities(activitiesResponse.data.data as Activity[])
    } catch (error: any) {
      showToast('菜单同步失败：' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setSyncingMenus(false)
    }
  }

  // Update greeting based on time
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 6) setGreeting('夜深了')
    else if (hour < 9) setGreeting('早上好')
    else if (hour < 12) setGreeting('上午好')
    else if (hour < 14) setGreeting('中午好')
    else if (hour < 18) setGreeting('下午好')
    else setGreeting('晚上好')

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // 获取统计数据和系统状态
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 获取统计数据
        const statsResponse = await adminApi.apiAdminStatsGet()
        const statsData = statsResponse.data.data as DashboardStats
        setStats(statsData)

        // 系统状态现在通过 SignalR 实时获取，这里只做初始数据获取作为后备
        try {
          const statusResponse = await adminApi.apiAdminSystemStatusGet()
          const statusData = statusResponse.data.data as SystemStatus
          // 如果 SignalR 还没连接成功，使用 API 数据作为初始值
          if (!systemStatus) {
            // 使用 setTimeout 避免与 SignalR 更新冲突
            setTimeout(() => {
              // 状态已由 SignalR hook 管理
            }, 0)
          }
        } catch {
          // 忽略错误，SignalR 会提供数据
        }

        // 获取最近活动
        try {
          const activitiesResponse = await adminApi.apiAdminRecentActivitiesGet()
          const activitiesData = activitiesResponse.data.data as Activity[]
          setActivities(activitiesData)
        } catch {
          // 如果接口不存在，使用模拟数据
          setActivities([
            { id: '1', type: 'user', title: '新用户注册', description: '用户 admin 刚刚完成了注册', time: '2分钟前', user: '系统' },
            { id: '2', type: 'document', title: '文档更新', description: 'API 文档 v2.0 已更新', time: '15分钟前', user: '张三' },
            { id: '3', type: 'project', title: '项目创建', description: '新项目 "Neuro AI" 已创建', time: '1小时前', user: '李四' },
            { id: '4', type: 'system', title: '系统备份', description: '每日自动备份已完成', time: '3小时前', user: '系统' },
            { id: '5', type: 'user', title: '角色变更', description: '用户王五被分配为管理员', time: '5小时前', user: '管理员' },
          ])
        }
      } catch (error: any) {
        console.error('获取数据失败:', error)
        showToast('获取统计数据失败', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [showToast])

  const allQuickActions: QuickAction[] = [
    {
      key: 'users',
      title: '用户管理',
      description: '管理系统用户及其角色',
      icon: <UsersIcon className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      route: 'users'
    },
    {
      key: 'roles',
      title: '角色管理',
      description: '配置角色及权限',
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      route: 'roles'
    },
    {
      key: 'teams',
      title: '团队管理',
      description: '管理团队及成员',
      icon: <UserGroupIcon className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      route: 'teams'
    },
    {
      key: 'projects',
      title: '项目管理',
      description: '管理项目信息',
      icon: <FolderIcon className="w-6 h-6" />,
      color: 'from-orange-500 to-amber-500',
      route: 'projects'
    },
    {
      key: 'documents',
      title: '文档管理',
      description: '管理知识库文档',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-500',
      route: 'documents'
    },
    {
      key: 'tenants',
      title: '租户管理',
      description: '管理多租户配置',
      icon: <BuildingOfficeIcon className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      route: 'tenants'
    },
    {
      key: 'menus',
      title: '菜单管理',
      description: '配置系统菜单',
      icon: <ListBulletIcon className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-500',
      route: 'menus'
    },
    {
      key: 'permissions',
      title: '权限管理',
      description: '管理系统权限',
      icon: <LockClosedIcon className="w-6 h-6" />,
      color: 'from-red-500 to-orange-500',
      route: 'permissions'
    },
    {
      key: 'ai-supports',
      title: 'AI 助手',
      description: '配置 AI 助手',
      icon: <CpuChipIcon className="w-6 h-6" />,
      color: 'from-violet-500 to-purple-500',
      route: 'ai-supports'
    },
    {
      key: 'git-credentials',
      title: 'Git 凭据',
      description: '管理 Git 凭据',
      icon: <KeyIcon className="w-6 h-6" />,
      color: 'from-gray-500 to-slate-500',
      route: 'git-credentials'
    },
    {
      key: 'file-resources',
      title: '文件资源',
      description: '管理文件资源',
      icon: <DocumentIcon className="w-6 h-6" />,
      color: 'from-yellow-500 to-amber-500',
      route: 'file-resources'
    },
    {
      key: 'notebook',
      title: '笔记本',
      description: '打开笔记本',
      icon: <BookOpenIcon className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-500',
      route: 'notebook'
    },
  ]

  // 默认显示的快捷操作（前6个）
  const defaultQuickActions = allQuickActions.slice(0, 6)
  const displayedQuickActions = showAllActions ? allQuickActions : defaultQuickActions

  // 统计数据配置
  const statsConfig = [
    { 
      title: '总用户数', 
      value: stats?.users?.toLocaleString() || '0', 
      change: '+12%', 
      changeType: 'positive' as const, 
      icon: <UsersIcon className="w-6 h-6" /> 
    },
    { 
      title: '活跃项目', 
      value: stats?.projects?.toLocaleString() || '0', 
      change: '+5%', 
      changeType: 'positive' as const, 
      icon: <FolderIcon className="w-6 h-6" /> 
    },
    { 
      title: '文档数量', 
      value: stats?.documents?.toLocaleString() || '0', 
      change: '+23%', 
      changeType: 'positive' as const, 
      icon: <DocumentTextIcon className="w-6 h-6" /> 
    },
    { 
      title: '团队数量', 
      value: stats?.teams?.toLocaleString() || '0', 
      change: '0%', 
      changeType: 'neutral' as const, 
      icon: <UserGroupIcon className="w-6 h-6" /> 
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="加载统计数据..." />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
              {greeting}，{user?.name || user?.account}！
            </h1>
            <p className="text-surface-500 dark:text-surface-400">
              {user?.isSuper 
                ? '您拥有超级管理员权限，可以访问所有功能模块' 
                : '您可以访问以下管理模块，开始您的工作'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 px-4 py-2 rounded-xl">
            <ClockIcon className="w-4 h-4" />
            {currentTime.toLocaleDateString('zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat, index) => (
          <div 
            key={stat.title}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">快捷入口</h2>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  快速访问常用功能模块
                </p>
              </div>
              <div className="flex items-center gap-2">
                {user?.isSuper && (
                  <>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      leftIcon={<ArrowPathIcon className={`w-4 h-4 ${syncingPermissions ? 'animate-spin' : ''}`} />}
                      onClick={handleSyncPermissions}
                      isLoading={syncingPermissions}
                    >
                      同步权限
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      leftIcon={<Bars3BottomLeftIcon className={`w-4 h-4 ${syncingMenus ? 'animate-spin' : ''}`} />}
                      onClick={handleSyncMenus}
                      isLoading={syncingMenus}
                    >
                      同步菜单
                    </Button>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAllActions(!showAllActions)}
                >
                  {showAllActions ? '收起' : '查看全部'}
                </Button>
              </div>
            </div>
            
            <div className={`grid sm:grid-cols-2 gap-4 transition-all duration-300 ${showAllActions ? '' : ''}`}>
              {displayedQuickActions.map((action, index) => (
                <button
                  key={action.key}
                  onClick={() => navigate(action.route as any)}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-surface-200 dark:border-surface-700 
                           hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft-lg transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <svg 
                    className="w-5 h-5 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">最近动态</h2>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  系统最新活动记录
                </p>
              </div>
              <Badge variant="info" dot pulse>
                实时
              </Badge>
            </div>

            <div className="space-y-4">
              {activities.slice((activityPagination.current - 1) * activityPagination.pageSize, activityPagination.current * activityPagination.pageSize).map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-surface-900 dark:text-white truncate">
                        {activity.title}
                      </h4>
                      <span className="text-xs text-surface-400 flex-shrink-0 ml-2">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                      {activity.description}
                    </p>
                    {activity.user && (
                      <p className="text-xs text-surface-400 mt-1">
                        操作人: {activity.user}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {activities.length > activityPagination.pageSize && (
              <div className="flex items-center justify-between px-2 pt-4 mt-4 border-t border-surface-200 dark:border-surface-700">
                <span className="text-sm text-surface-500 dark:text-surface-400">
                  共 {activities.length} 条
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivityPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                    disabled={activityPagination.current === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-surface-200 dark:border-surface-600 
                             text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700
                             disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-surface-600 dark:text-surface-400">
                    {activityPagination.current} / {Math.ceil(activities.length / activityPagination.pageSize)}
                  </span>
                  <button
                    onClick={() => setActivityPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                    disabled={activityPagination.current >= Math.ceil(activities.length / activityPagination.pageSize)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-surface-200 dark:border-surface-600 
                             text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700
                             disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shadow-glow mb-4">
                {user?.name?.[0] || user?.account?.[0] || 'U'}
              </div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                {user?.name || user?.account}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {user?.email}
              </p>
              <div className="mt-4">
                {user?.isSuper ? (
                  <Badge variant="danger" size="lg">
                    超级管理员
                  </Badge>
                ) : (
                  <Badge variant="primary" size="lg">
                    普通用户
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats?.projects || 0}</p>
                  <p className="text-xs text-surface-500">我的项目</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats?.documents || 0}</p>
                  <p className="text-xs text-surface-500">我的文档</p>
                </div>
              </div>
            </div>
          </Card>

          {/* System Status */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-900 dark:text-white">系统状态</h3>
              <Badge 
                variant={signalRConnected ? 'success' : 'warning'} 
                size="sm"
                dot={signalRConnected}
                pulse={signalRConnected}
              >
                {signalRConnected ? '实时' : '连接中...'}
              </Badge>
            </div>
            {systemStatus ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-surface-600 dark:text-surface-400">CPU 使用率</span>
                    <span className="font-medium text-surface-900 dark:text-white">{systemStatus.cpuUsage}%</span>
                  </div>
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        systemStatus.cpuUsage > 80 ? 'bg-red-500' : 
                        systemStatus.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} 
                      style={{ width: `${systemStatus.cpuUsage}%` }} 
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-surface-600 dark:text-surface-400">内存使用</span>
                    <span className="font-medium text-surface-900 dark:text-white">
                      {systemStatus.memoryUsage}% ({systemStatus.memoryUsed}MB / {systemStatus.memoryTotal}MB)
                    </span>
                  </div>
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        systemStatus.memoryUsage > 80 ? 'bg-red-500' : 
                        systemStatus.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} 
                      style={{ width: `${systemStatus.memoryUsage}%` }} 
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-surface-600 dark:text-surface-400">存储空间</span>
                    <span className="font-medium text-surface-900 dark:text-white">
                      {systemStatus.storageUsage}% ({systemStatus.storageUsed}GB / {systemStatus.storageTotal}GB)
                    </span>
                  </div>
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        systemStatus.storageUsage > 80 ? 'bg-red-500' : 
                        systemStatus.storageUsage > 60 ? 'bg-yellow-500' : 'bg-purple-500'
                      }`} 
                      style={{ width: `${systemStatus.storageUsage}%` }} 
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
                  <div className="flex items-center justify-between text-xs text-surface-500">
                    <span>运行时间</span>
                    <span>{systemStatus.uptime}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-surface-500 py-4">
                加载中...
              </div>
            )}
          </Card>

          {/* Document Generation Progress */}
          {projectsWithDocGen.some(p => p.docGenStatus === 1 || p.docGenStatus === 2) && (
            <Card className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-surface-900 dark:text-white">文档生成进度</h3>
                <Badge variant="info" dot pulse>
                  进行中
                </Badge>
              </div>
              <div className="space-y-4">
                {projectsWithDocGen
                  .filter(p => p.docGenStatus === 1 || p.docGenStatus === 2)
                  .map(project => {
                    const progress = project.docGenProgress
                    const statusColors: Record<number, string> = {
                      1: 'bg-blue-500',
                      2: 'bg-yellow-500'
                    }
                    const statusText: Record<number, string> = {
                      1: '拉取中',
                      2: '生成中'
                    }
                    
                    return (
                      <div key={project.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-surface-700 dark:text-surface-300 font-medium">{project.name}</span>
                          <span className="text-surface-500 text-xs">
                            {progress ? `${progress.statusText} (${progress.progress}%)` : statusText[project.docGenStatus || 0]}
                          </span>
                        </div>
                        <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${statusColors[project.docGenStatus || 0]}`}
                            style={{ width: `${progress?.progress || (project.docGenStatus === 1 ? 10 : 40)}%` }} 
                          />
                        </div>
                        {progress?.message && (
                          <p className="text-xs text-surface-500 mt-1">{progress.message}</p>
                        )}
                      </div>
                    )
                  })}
              </div>
            </Card>
          )}

          {/* Quick Tips */}
          <Card className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-200 dark:border-primary-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-white mb-1">
                  使用提示
                </h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  使用快捷键 Ctrl+K 可以快速打开搜索功能，提高您的工作效率。
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
