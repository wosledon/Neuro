import React, { useState, useEffect } from 'react'
import { Button, Input } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ToastProvider'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'

type Props = {
  onBack: () => void
  onLogin?: () => void
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
    } catch (error: any) {
      console.error('Login error:', error)
      showToast(error.response?.data?.message || '登录失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-surface-900 rounded-2xl shadow-soft-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Brand */}
          <div className="lg:w-2/5 bg-gradient-to-br from-primary-600 to-accent-600 p-8 lg:p-10 flex flex-col justify-between text-white">
            <div>
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <img 
                  src="/assets/logo.png" 
                  alt="Neuro Logo" 
                  className="w-10 h-10 rounded-lg object-cover bg-white/20"
                />
                <span className="text-xl font-bold">Neuro</span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight">
                让知识
                <br />
                流动起来
              </h2>
              
              <p className="text-white/80 text-sm leading-relaxed">
                AI 驱动的知识管理平台，将文档、API 与向量数据库连成一张网。
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 mt-8 lg:mt-0">
              <div className="flex items-center gap-3 text-sm text-white/90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                智能问答与检索
              </div>
              <div className="flex items-center gap-3 text-sm text-white/90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                多租户权限管理
              </div>
              <div className="flex items-center gap-3 text-sm text-white/90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                团队协作与共享
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:w-3/5 p-8 lg:p-10">
            {/* Header */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                欢迎回来
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
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
        </div>
      </div>

      {/* Footer */}
      <p className="fixed bottom-4 text-xs text-surface-400">
        © 2025 Neuro. All rights reserved.
      </p>
    </div>
  )
}
