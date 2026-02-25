import React, { useState, useEffect } from 'react'
import { useRouter } from '../router'
import { Button, Badge } from '../components'
import { 
  CpuChipIcon,
  DocumentTextIcon,
  UsersIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CodeBracketIcon,
  ServerIcon,
  CircleStackIcon,
  BoltIcon,
  LockClosedIcon,
  CloudIcon,
  CommandLineIcon,
  CubeIcon,
  RocketLaunchIcon,
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/solid'
import { FaGithub } from 'react-icons/fa'

// Feature card component
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <div className="group p-6 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft-lg transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{description}</p>
    </div>
  )
}

// Tech stack item
interface TechItemProps {
  name: string
  icon: React.ReactNode
}

function TechItem({ name, icon }: TechItemProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
      <span className="text-surface-600 dark:text-surface-400">{icon}</span>
      <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{name}</span>
    </div>
  )
}

// Pricing card
interface PricingCardProps {
  title: string
  price: string
  period: string
  features: string[]
  highlighted?: boolean
  buttonText: string
  onClick: () => void
}

function PricingCard({ title, price, period, features, highlighted, buttonText, onClick }: PricingCardProps) {
  return (
    <div className={`relative p-8 rounded-2xl border ${highlighted 
      ? 'border-primary-500 bg-gradient-to-b from-primary-500/5 to-transparent dark:from-primary-500/10' 
      : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'} 
      hover:shadow-soft-xl transition-all duration-300`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge variant="primary" size="lg">推荐</Badge>
        </div>
      )}
      <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-bold text-surface-900 dark:text-white">{price}</span>
        <span className="text-surface-500 dark:text-surface-400">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-400">
            <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <Button 
        variant={highlighted ? 'primary' : 'secondary'} 
        className="w-full"
        onClick={onClick}
      >
        {buttonText}
      </Button>
    </div>
  )
}

export default function LandingPage() {
  const { navigate } = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  const features = [
    {
      icon: <CpuChipIcon className="w-6 h-6 text-white" />,
      title: 'AI 驱动',
      description: '集成大语言模型，支持智能问答、文档分析和知识检索，让知识库真正"活"起来。',
      color: 'bg-gradient-to-br from-violet-500 to-purple-600'
    },
    {
      icon: <DocumentTextIcon className="w-6 h-6 text-white" />,
      title: '文档管理',
      description: '支持多种格式文档上传和转换，自动提取内容并建立索引，构建企业级知识库。',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500'
    },
    {
      icon: <UsersIcon className="w-6 h-6 text-white" />,
      title: '团队协作',
      description: '多租户架构支持，细粒度的权限控制，团队、项目、角色灵活配置。',
      color: 'bg-gradient-to-br from-green-500 to-emerald-500'
    },
    {
      icon: <ShieldCheckIcon className="w-6 h-6 text-white" />,
      title: '权限安全',
      description: '基于 RBAC 的权限模型，支持接口级别权限控制，数据隔离保障安全。',
      color: 'bg-gradient-to-br from-orange-500 to-red-500'
    },
    {
      icon: <CircleStackIcon className="w-6 h-6 text-white" />,
      title: '向量检索',
      description: '内置向量存储和 ONNX 向量化，支持语义搜索，理解用户真实意图。',
      color: 'bg-gradient-to-br from-pink-500 to-rose-500'
    },
    {
      icon: <BoltIcon className="w-6 h-6 text-white" />,
      title: '高性能',
      description: '.NET 10 高性能后端，React 18 现代化前端，响应迅速体验流畅。',
      color: 'bg-gradient-to-br from-yellow-500 to-amber-500'
    }
  ]

  const techStack = [
    { name: '.NET 10', icon: <CommandLineIcon className="w-5 h-5" /> },
    { name: 'React 18', icon: <CodeBracketIcon className="w-5 h-5" /> },
    { name: 'TypeScript', icon: <DocumentTextIcon className="w-5 h-5" /> },
    { name: 'Tailwind CSS', icon: <SparklesIcon className="w-5 h-5" /> },
    { name: 'EF Core 10', icon: <CircleStackIcon className="w-5 h-5" /> },
    { name: 'SQLite/PostgreSQL', icon: <ServerIcon className="w-5 h-5" /> },
    { name: 'ONNX Runtime', icon: <CpuChipIcon className="w-5 h-5" /> },
    { name: 'JWT Auth', icon: <LockClosedIcon className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg shadow-soft-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/assets/logo.png" 
                alt="Neuro Logo" 
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="font-bold text-xl text-surface-900 dark:text-white">Neuro</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">功能特性</button>
              <button onClick={() => scrollToSection('tech')} className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">技术栈</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">价格</button>
              <button onClick={() => navigate('login')} className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">登录</button>
              <Button size="sm" onClick={() => navigate('login')}>免费开始</Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-lg text-surface-600 dark:text-surface-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-surface-600 dark:text-surface-400">功能特性</button>
              <button onClick={() => scrollToSection('tech')} className="block w-full text-left py-2 text-surface-600 dark:text-surface-400">技术栈</button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-2 text-surface-600 dark:text-surface-400">价格</button>
              <button onClick={() => navigate('login')} className="block w-full text-left py-2 text-surface-600 dark:text-surface-400">登录</button>
              <Button className="w-full" onClick={() => navigate('login')}>免费开始</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-gradient-to-t from-accent-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="info" size="lg" className="mb-6">
            <SparklesIcon className="w-4 h-4 mr-1" />
            AI 驱动的知识库管理系统
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-surface-900 dark:text-white mb-6 leading-tight">
            让知识管理更
            <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">智能</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Neuro 是一个现代化的 AI 知识库平台，结合大语言模型与向量检索技术，
            帮助企业构建智能化的知识管理体系。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" leftIcon={<RocketLaunchIcon className="w-5 h-5" />} onClick={() => navigate('login')}>
              立即开始
            </Button>
            <Button size="lg" variant="secondary" leftIcon={<BookOpenIcon className="w-5 h-5" />} onClick={() => scrollToSection('features')}>
              了解更多
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: '10+', label: '文档格式' },
              { value: '99.9%', label: '服务可用性' },
              { value: '<100ms', label: '响应时间' },
              { value: '∞', label: '扩展性' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-surface-500 dark:text-surface-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4">核心功能</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              为知识管理而生
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              从文档存储到智能检索，从权限管理到团队协作，Neuro 提供完整的知识管理解决方案。
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="py-20 lg:py-32 bg-surface-100 dark:bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="success" className="mb-4">技术栈</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              现代化技术架构
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              基于最新的技术栈构建，高性能、可扩展、易维护。
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {techStack.map((tech, index) => (
              <TechItem key={index} {...tech} />
            ))}
          </div>

          {/* Architecture Diagram Placeholder */}
          <div className="mt-16 p-8 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6 text-center">系统架构</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-800">
                <CloudIcon className="w-8 h-8 text-blue-500 mb-3" />
                <h4 className="font-semibold text-surface-900 dark:text-white mb-2">前端层</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">React 18 + TypeScript + Tailwind CSS + Vite</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-200 dark:border-green-800">
                <ServerIcon className="w-8 h-8 text-green-500 mb-3" />
                <h4 className="font-semibold text-surface-900 dark:text-white mb-2">API 层</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">ASP.NET Core 10 + EF Core + JWT 认证</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800">
                <CircleStackIcon className="w-8 h-8 text-purple-500 mb-3" />
                <h4 className="font-semibold text-surface-900 dark:text-white mb-2">数据层</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">SQLite/PostgreSQL + 向量存储 + 文件存储</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="danger" className="mb-4">价格方案</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              简单透明的定价
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              开源免费，自主部署。也可选择我们的云服务方案。
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              title="开源版"
              price="免费"
              period=""
              features={[
                '完整的知识库功能',
                'AI 问答与检索',
                '多租户支持',
                '权限管理',
                '社区支持',
                '自主部署'
              ]}
              buttonText="立即下载"
              onClick={() => window.open('https://github.com/your-org/neuro', '_blank')}
            />
            <PricingCard
              title="专业版"
              price="¥99"
              period="/月"
              features={[
                '开源版全部功能',
                '高级 AI 模型支持',
                '优先技术支持',
                '自定义域名',
                'SSL 证书',
                '数据备份'
              ]}
              highlighted
              buttonText="开始使用"
              onClick={() => navigate('login')}
            />
            <PricingCard
              title="企业版"
              price="定制"
              period=""
              features={[
                '专业版全部功能',
                '私有化部署',
                '专属客户经理',
                '定制开发',
                'SLA 保障',
                '培训服务'
              ]}
              buttonText="联系我们"
              onClick={() => window.location.href = 'mailto:sales@neuro.local'}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary-500 to-accent-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            立即体验 Neuro，构建您的智能化知识库。开源免费，一键部署。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-primary-600 hover:bg-white/90"
              leftIcon={<RocketLaunchIcon className="w-5 h-5" />}
              onClick={() => navigate('login')}
            >
              免费开始使用
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              leftIcon={<FaGithub className="w-5 h-5" />}
              onClick={() => window.open('https://github.com/your-org/neuro', '_blank')}
            >
              查看源码
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-surface-900 text-surface-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/assets/logo.png" 
                  alt="Neuro Logo" 
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <span className="font-bold text-white">Neuro</span>
              </div>
              <p className="text-sm">AI 驱动的知识库管理系统</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">产品</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">功能特性</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">价格</button></li>
                <li><button onClick={() => navigate('login')} className="hover:text-white transition-colors">开始使用</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">资源</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">文档</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API 参考</a></li>
                <li><a href="#" className="hover:text-white transition-colors">更新日志</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">社区</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">问题反馈</a></li>
                <li><a href="#" className="hover:text-white transition-colors">联系我们</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-surface-800 text-sm text-center">
            © 2025 Neuro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
