import React, { useState, useEffect } from 'react'
import { Button, Input } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ToastProvider'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'

type Props = {
  onBack: () => void
  onLogin?: () => void
}

// Animated background particles
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10 animate-float"
          style={{
            width: Math.random() * 100 + 50 + 'px',
            height: Math.random() * 100 + 50 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: Math.random() * 5 + 's',
            animationDuration: Math.random() * 10 + 10 + 's',
          }}
        />
      ))}
    </div>
  )
}

// Feature item component
function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function Login({ onBack, onLogin }: Props) {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const { show: showToast } = useToast()

  // Load saved account
  useEffect(() => {
    const savedAccount = localStorage.getItem('remembered_account')
    if (savedAccount) {
      setAccount(savedAccount)
      setRememberMe(true)
    }
  }, [])

  // Handle redirect after successful login
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, calling onLogin callback')
      onLogin?.()
    }
  }, [isAuthenticated, onLogin])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!account || !password) {
      showToast('请输入账号和密码', 'error')
      return
    }

    setIsLoading(true)
    try {
      await login(account, password)
      
      // Save account if remember me is checked
      if (rememberMe) {
        localStorage.setItem('remembered_account', account)
      } else {
        localStorage.removeItem('remembered_account')
      }
      
      showToast('登录成功', 'success')
      // onLogin will be called by the useEffect when isAuthenticated changes
    } catch (error: any) {
      console.error('Login error:', error)
      showToast(error.response?.data?.message || '登录失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: '🧠',
      title: '智能知识管理',
      description: '基于 RAG 技术的智能问答系统，让知识触手可及'
    },
    {
      icon: '📊',
      title: '实时数据分析',
      description: '可视化展示项目进度与团队协作数据'
    },
    {
      icon: '🔒',
      title: '安全可靠',
      description: '企业级权限管理，保障数据安全'
    },
    {
      icon: '⚡',
      title: '高效协作',
      description: '团队实时同步，提升工作效率'
    }
  ]

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-surface-950 via-primary-950 to-surface-950 text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        <ParticleBackground />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Brand & Features */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12 lg:py-0">
          <div className="max-w-xl">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold shadow-glow">
                N
              </div>
              <div>
                <h1 className="text-2xl font-bold">Neuro Studio</h1>
                <p className="text-sm text-slate-400">AI Knowledge + Docs</p>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              让知识与 AI
              <span className="block bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                真正流动
              </span>
            </h2>
            
            <p className="text-lg text-slate-300 mb-10 leading-relaxed">
              Neuro 将您的文档、API、PR 讨论与向量数据库连成一张网，
              提供沉浸式的导航与实时洞察。
            </p>

            {/* Features Grid */}
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <FeatureItem {...feature} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 py-12">
          <div className="w-full max-w-md">
            <div className="card bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl p-8 animate-fade-in-up">
              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                  欢迎回来
                </h3>
                <p className="text-surface-500 dark:text-surface-400">
                  登录您的账户以继续
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="账号"
                  type="text"
                  placeholder="请输入账号"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                  required
                />

                <div className="relative">
                  <Input
                    label="密码"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-surface-400 hover:text-surface-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    }
                    required
                  />
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-surface-600 dark:text-surface-400">记住我</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    忘记密码？
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full"
                >
                  立即登录
                </Button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full py-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                >
                  返回首页
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200 dark:border-surface-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-surface-900 text-surface-500">
                    或者
                  </span>
                </div>
              </div>

              {/* Register Link */}
              <p className="text-center text-sm text-surface-600 dark:text-surface-400">
                还没有账号？{' '}
                <button className="text-primary-600 hover:text-primary-700 font-medium">
                  立即注册
                </button>
              </p>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-500 mt-6">
              © 2024 Neuro Studio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
