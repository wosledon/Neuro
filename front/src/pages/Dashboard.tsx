import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from '../router'

export default function Dashboard() {
  const { user, menus } = useAuth()
  const { navigate } = useRouter()

  const menuCards = [
    { key: 'users', title: '用户管理', desc: '管理系统用户及其角色', icon: '👥', color: 'bg-blue-500' },
    { key: 'roles', title: '角色管理', desc: '配置角色及权限', icon: '🛡️', color: 'bg-purple-500' },
    { key: 'teams', title: '团队管理', desc: '管理团队及成员', icon: '🤝', color: 'bg-green-500' },
    { key: 'projects', title: '项目管理', desc: '管理项目信息', icon: '📁', color: 'bg-orange-500' },
    { key: 'documents', title: '文档管理', desc: '管理知识库文档', icon: '📄', color: 'bg-teal-500' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">欢迎回来，{user?.name || user?.account}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.isSuper ? '您拥有超级管理员权限' : '您可以访问以下管理模块'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuCards.map(card => (
          <button
            key={card.key}
            onClick={() => navigate(card.key as any)}
            className="text-left p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 group"
          >
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('users')}
            className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow text-sm"
          >
            + 新增用户
          </button>
          <button 
            onClick={() => navigate('documents')}
            className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow text-sm"
          >
            + 新增文档
          </button>
          <button 
            onClick={() => navigate('projects')}
            className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow text-sm"
          >
            + 新增项目
          </button>
        </div>
      </div>
    </div>
  )
}
