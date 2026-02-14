import React from 'react'
import { useRouter } from '../router'
import { Button } from '../components'
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'

export default function NotFound() {
  const { navigate } = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-9xl font-bold text-surface-200 dark:text-surface-800 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">
          页面未找到
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mb-8">
          抱歉，您访问的页面不存在或已被移除。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            onClick={() => navigate('dashboard')}
            leftIcon={<HomeIcon className="w-4 h-4" />}
          >
            返回首页
          </Button>
          <Button 
            variant="secondary"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
          >
            返回上一页
          </Button>
        </div>
      </div>
    </div>
  )
}
