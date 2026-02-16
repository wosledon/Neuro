import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Badge } from '../components'
import { useToast } from '../components/ToastProvider'
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  SignalIcon,
  StopIcon
} from '@heroicons/react/24/solid'
import { chatApi } from '../services/chat'
import { useChatSignalR, ChatSource } from '../hooks/useChatSignalR'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: ChatSource[]
}



interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export default function Chat() {
  const { show: showToast } = useToast()
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chat_sessions')
    if (saved) {
      return JSON.parse(saved).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }))
    }
    return []
  })
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [showSources, setShowSources] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [topK, setTopK] = useState(() => {
    const saved = localStorage.getItem('chat_topk')
    return saved ? parseInt(saved, 10) : 5
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const streamingMessageId = useRef<string | null>(null)
  const [searchResults, setSearchResults] = useState<ChatSource[]>([])

  // 点击外部关闭设置弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 保存 topK 设置
  useEffect(() => {
    localStorage.setItem('chat_topk', topK.toString())
  }, [topK])

  const currentSession = sessions.find(s => s.id === currentSessionId)

  // SignalR 流式聊天
  const handleAnswerChunk = useCallback((chunk: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId && streamingMessageId.current) {
        const lastMessage = s.messages[s.messages.length - 1]
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
          return {
            ...s,
            messages: s.messages.map(m => 
              m.id === streamingMessageId.current
                ? { ...m, content: m.content + chunk }
                : m
            )
          }
        }
      }
      return s
    }))
  }, [currentSessionId])

  const handleAnswerComplete = useCallback((sources: ChatSource[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId && streamingMessageId.current) {
        return {
          ...s,
          messages: s.messages.map(m => 
            m.id === streamingMessageId.current
              ? { ...m, isStreaming: false, sources }
              : m
          )
        }
      }
      return s
    }))
    streamingMessageId.current = null
    setSearchResults([])
  }, [currentSessionId])

  const handleSearchComplete = useCallback((data: { count: number; sources: ChatSource[] }) => {
    setSearchResults(data.sources)
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    showToast(errorMessage, 'error')
    // 移除正在流式输出的消息
    if (streamingMessageId.current) {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: s.messages.filter(m => m.id !== streamingMessageId.current)
          }
        }
        return s
      }))
      streamingMessageId.current = null
    }
  }, [currentSessionId, showToast])

  const { isConnected, isStreaming, sendMessage: sendStreamMessage, cancelStream } = useChatSignalR({
    onAnswerChunk: handleAnswerChunk,
    onAnswerComplete: handleAnswerComplete,
    onSearchComplete: handleSearchComplete,
    onError: handleError
  })

  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.messages])

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: new Date()
    }
    setSessions([newSession, ...sessions])
    setCurrentSessionId(newSession.id)
  }

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions(sessions.filter(s => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    let sessionId = currentSessionId

    // 如果没有当前会话，创建一个新会话
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 20) + (input.length > 20 ? '...' : ''),
        messages: [userMessage],
        createdAt: new Date()
      }
      setSessions([newSession, ...sessions])
      setCurrentSessionId(newSession.id)
      sessionId = newSession.id
    } else {
      // 更新现有会话
      setSessions(sessions.map(s => {
        if (s.id === sessionId) {
          const title = s.messages.length === 0 
            ? input.slice(0, 20) + (input.length > 20 ? '...' : '')
            : s.title
          return { ...s, title, messages: [...s.messages, userMessage] }
        }
        return s
      }))
    }

    const question = input
    setInput('')

    // 添加 AI 消息占位符
    const aiMessageId = (Date.now() + 1).toString()
    streamingMessageId.current = aiMessageId
    
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }
    
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: [...s.messages, aiMessage] }
      }
      return s
    }))

    // 使用 SignalR 发送消息
    const success = await sendStreamMessage(question, topK, sessionId)
    
    if (!success) {
      // 发送失败，移除占位符
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: s.messages.filter(m => m.id !== aiMessageId) }
        }
        return s
      }))
      streamingMessageId.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearCurrentSession = () => {
    if (!currentSessionId) return
    setSessions(sessions.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [] }
        : s
    ))
  }

  // 快速搜索功能
  const quickSearch = async (query: string) => {
    setInput(query)
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `搜索: ${query}`,
      timestamp: new Date()
    }

    let sessionId = currentSessionId
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: `搜索: ${query.slice(0, 20)}`,
        messages: [userMessage],
        createdAt: new Date()
      }
      setSessions([newSession, ...sessions])
      setCurrentSessionId(newSession.id)
      sessionId = newSession.id
    } else {
      setSessions(sessions.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, userMessage] }
          : s
      ))
    }

    // 使用 SignalR 发送搜索请求
    const success = await sendStreamMessage(query, 5, sessionId)
    
    if (!success) {
      showToast('搜索失败', 'error')
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] -m-4 lg:-m-6 bg-surface-50 dark:bg-surface-950">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col">
        {/* New Chat Button */}
        <div className="p-4">
          <Button 
            onClick={createNewSession}
            leftIcon={<PlusIcon className="w-4 h-4" />}
            className="w-full justify-start"
          >
            新建对话
          </Button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                currentSessionId === session.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
              }`}
            >
              <ChatBubbleLeftIcon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate text-sm">{session.title}</span>
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 transition-opacity"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Quick Search Suggestions */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-800">
          <p className="text-xs text-surface-500 mb-2">快速搜索</p>
          <div className="space-y-1">
            {['项目文档', 'API 说明', '使用指南'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => quickSearch(suggestion)}
                className="flex items-center gap-2 px-2 py-1.5 w-full rounded text-xs text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <MagnifyingGlassIcon className="w-3 h-3" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-800 relative" ref={settingsRef}>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors ${
              showSettings 
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4" />
            <span className="text-sm">设置</span>
          </button>
          
          {/* Settings Popup */}
          {showSettings && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-3 px-4 z-50">
              <h4 className="text-sm font-medium text-surface-900 dark:text-white mb-3">聊天设置</h4>
              
              {/* Show Sources Toggle */}
              <label className="flex items-center justify-between mb-3 cursor-pointer">
                <span className="text-sm text-surface-600 dark:text-surface-400">显示参考来源</span>
                <button
                  onClick={() => setShowSources(!showSources)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    showSources ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    showSources ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
              
              {/* TopK Setting */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-surface-600 dark:text-surface-400">搜索结果数量</span>
                  <span className="text-xs text-surface-500">{topK}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-surface-400 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <h2 className="font-medium text-surface-900 dark:text-white">
                  {currentSession.title}
                </h2>
                <Badge 
                  variant={isConnected ? 'success' : 'warning'} 
                  size="sm"
                  dot={isConnected}
                  pulse={isConnected}
                >
                  {isConnected ? '实时' : '连接中'}
                </Badge>
              </div>
              <button
                onClick={clearCurrentSession}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
                title="清空对话"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {currentSession.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-surface-400">
                  <SparklesIcon className="w-12 h-12 mb-4" />
                  <p className="text-lg font-medium">开始新的对话</p>
                  <p className="text-sm">输入你的问题，AI 助手将基于知识库为你解答</p>
                  <div className="mt-6 flex gap-2">
                    {['什么是 Neuro?', '如何创建项目?', '文档支持哪些格式?'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion)
                        }}
                        className="px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-xs text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                currentSession.messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'assistant' ? 'bg-surface-100 dark:bg-surface-800/50 -mx-6 px-6 py-4' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gradient-to-br from-violet-500 to-purple-500 text-white'
                    }`}>
                      {message.role === 'user' ? (
                        <span className="text-sm font-medium">我</span>
                      ) : (
                        <SparklesIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-900 dark:text-white">
                          {message.role === 'user' ? '我' : 'AI 助手'}
                        </span>
                        <span className="text-xs text-surface-400">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                        {message.content}
                      </div>
                      
                      {/* Sources */}
                      {showSources && message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                          <p className="text-xs text-surface-500 mb-2">参考来源：</p>
                          <div className="space-y-2">
                            {message.sources.map((source, index) => (
                              <div 
                                key={index}
                                className="p-2 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-surface-500">[{index + 1}]</span>
                                  <span className="text-surface-600 dark:text-surface-400">{source.source}</span>
                                  <span className="text-surface-400">({(source.score * 100).toFixed(1)}%)</span>
                                </div>
                                <p className="text-surface-700 dark:text-surface-300 line-clamp-2">
                                  {source.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
              <div className="max-w-4xl mx-auto flex gap-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isStreaming ? 'AI 正在回答...' : '输入你的问题...'}
                  rows={1}
                  disabled={isStreaming}
                  className="flex-1 resize-none rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                {isStreaming ? (
                  <Button
                    onClick={cancelStream}
                    variant="danger"
                    leftIcon={<StopIcon className="w-4 h-4" />}
                    className="self-end"
                  >
                    停止
                  </Button>
                ) : (
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || !isConnected}
                    leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
                    className="self-end"
                  >
                    发送
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-surface-400">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-3xl shadow-glow mb-6">
              N
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
              Neuro AI 助手
            </h1>
            <p className="text-surface-500 mb-8">基于知识库的智能问答系统</p>
            <Button
              onClick={createNewSession}
              leftIcon={<PlusIcon className="w-4 h-4" />}
              size="lg"
            >
              开始新对话
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
