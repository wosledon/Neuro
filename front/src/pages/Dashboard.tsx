import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from '../router'
import { Card, StatCard, Button, Badge } from '../components'
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  FolderIcon, 
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  SparklesIcon
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

// Mock activities data
const mockActivities: Activity[] = [
  { id: '1', type: 'user', title: '新用户注册', description: '用户 admin 刚刚完成了注册', time: '2分钟前', user: '系统' },
  { id: '2', type: 'document', title: '文档更新', description: 'API 文档 v2.0 已更新', time: '15分钟前', user: '张三' },
  { id: '3', type: 'project', title: '项目创建', description: '新项目 "Neuro AI" 已创建', time: '1小时前', user: '李四' },
  { id: '4', type: 'system', title: '系统备份', description: '每日自动备份已完成', time: '3小时前', user: '系统' },
  { id: '5', type: 'user', title: '角色变更', description: '用户王五被分配为管理员', time: '5小时前', user: '管理员' },
]

// Quick action type
interface QuickAction {
  key: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  route: string
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

export default function Dashboard() {
  const { user, menus } = useAuth()
  const { navigate } = useRouter()
  const [greeting, setGreeting] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

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

  const quickActions: QuickAction[] = [
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
  ]

  const stats = [
    { title: '总用户数', value: '1,234', change: '+12%', changeType: 'positive' as const, icon: <UsersIcon className="w-6 h-6" /> },
    { title: '活跃项目', value: '56', change: '+5%', changeType: 'positive' as const, icon: <FolderIcon className="w-6 h-6" /> },
    { title: '文档数量', value: '892', change: '+23%', changeType: 'positive' as const, icon: <DocumentTextIcon className="w-6 h-6" /> },
    { title: '团队数量', value: '18', change: '0%', changeType: 'neutral' as const, icon: <UserGroupIcon className="w-6 h-6" /> },
  ]

  return (
    <div className="container-main py-8 animate-fade-in">
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
        {stats.map((stat, index) => (
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
              <Button variant="ghost" size="sm">
                查看全部
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
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
              {mockActivities.map((activity, index) => (
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
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">12</p>
                  <p className="text-xs text-surface-500">我的项目</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">48</p>
                  <p className="text-xs text-surface-500">我的文档</p>
                </div>
              </div>
            </div>
          </Card>

          {/* System Status */}
          <Card>
            <h3 className="font-bold text-surface-900 dark:text-white mb-4">系统状态</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-surface-600 dark:text-surface-400">CPU 使用率</span>
                  <span className="font-medium text-surface-900 dark:text-white">32%</span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full w-[32%] bg-green-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-surface-600 dark:text-surface-400">内存使用</span>
                  <span className="font-medium text-surface-900 dark:text-white">64%</span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full w-[64%] bg-yellow-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-surface-600 dark:text-surface-400">存储空间</span>
                  <span className="font-medium text-surface-900 dark:text-white">45%</span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full w-[45%] bg-blue-500 rounded-full" />
                </div>
              </div>
            </div>
          </Card>

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
