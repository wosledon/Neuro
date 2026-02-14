import React from 'react'
import { useRouter } from '../router'
import { Button } from '../components'
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid'

export default function Home() {
  const { navigate } = useRouter()

  const features = [
    {
      icon: <SparklesIcon className="w-6 h-6" />,
      title: 'AI 驱动',
      description: '基于 RAG 技术的智能问答系统'
    },
    {
      icon: <DocumentTextIcon className="w-6 h-6" />,
      title: '文档管理',
      description: '支持多种格式的文档转换与管理'
    },
    {
      icon: <UsersIcon className="w-6 h-6" />,
      title: '团队协作',
      description: '灵活的团队与权限管理'
    },
    {
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      title: '安全可靠',
      description: '企业级的数据安全保障'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-primary-950 to-surface-950 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        </div>

        {/* Content */}
        <div className="relative z-10 container-main py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            {/* Logo */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                N
              </div>
              <span className="text-sm font-medium">Neuro Studio</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              让知识与 AI
              <span className="block bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                真正流动
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Neuro 将您的文档、API、PR 讨论与向量数据库连成一张网，
              提供沉浸式的导航与实时洞察。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('login')}
                rightIcon={<ArrowRightIcon className="w-5 h-5" />}
                className="w-full sm:w-auto"
              >
                开始使用
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => navigate('components')}
                className="w-full sm:w-auto"
              >
                查看组件
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container-main py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">核心功能</h2>
          <p className="text-slate-400">打造智能化知识管理体验</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="container-main">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <p>© 2024 Neuro Studio. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">隐私政策</a>
              <a href="#" className="hover:text-white transition-colors">使用条款</a>
              <a href="#" className="hover:text-white transition-colors">联系我们</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
