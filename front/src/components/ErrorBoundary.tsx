import React, { Component, ReactNode } from 'react'
import { Button, Card } from './'
import { ExclamationCircleIcon } from '@heroicons/react/24/solid'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 可以在这里记录错误到日志系统
    // logErrorToService(error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // 可以渲染自定义的降级 UI
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <ExclamationCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                  抱歉，页面出现了问题
                </h2>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-1">
                    错误信息
                  </h3>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300 font-mono break-all">
                    {this.state.error?.toString()}
                  </div>
                </div>
                
                {this.state.errorInfo && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-1">
                      堆栈跟踪
                    </h3>
                    <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg text-xs text-surface-600 dark:text-surface-400 font-mono overflow-x-auto max-h-60">
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={this.handleReset}
                    leftIcon={<ExclamationCircleIcon className="w-4 h-4" />}
                  >
                    刷新页面
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => window.location.href = '/'}
                  >
                    回到首页
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
