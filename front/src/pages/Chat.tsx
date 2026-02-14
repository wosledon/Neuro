import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../components'
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/solid'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export default function Chat() {
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
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentSession = sessions.find(s => s.id === currentSessionId)

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
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    let sessionId = currentSessionId
    let updatedSessions = sessions

    // 如果没有当前会话，创建一个新会话
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 20) + (input.length > 20 ? '...' : ''),
        messages: [userMessage],
        createdAt: new Date()
      }
      updatedSessions = [newSession, ...sessions]
      setSessions(updatedSessions)
      setCurrentSessionId(newSession.id)
      sessionId = newSession.id
    } else {
      // 更新现有会话
      updatedSessions = sessions.map(s => {
        if (s.id === sessionId) {
          // 如果是第一条消息，更新标题
          const title = s.messages.length === 0 
            ? input.slice(0, 20) + (input.length > 20 ? '...' : '')
            : s.title
          return { ...s, title, messages: [...s.messages, userMessage] }
        }
        return s
      })
      setSessions(updatedSessions)
    }

    setInput('')
    setIsLoading(true)

    // 模拟 AI 回复
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '这是一个模拟的 AI 回复。在实际应用中，这里会调用后端 API 获取真实的 AI 回复。',
        timestamp: new Date()
      }
      
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: [...s.messages, aiMessage] }
        }
        return s
      }))
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

        {/* Settings */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-800">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 transition-colors">
            <Cog6ToothIcon className="w-4 h-4" />
            <span className="text-sm">设置</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex items-center justify-between px-6">
              <h2 className="font-medium text-surface-900 dark:text-white">
                {currentSession.title}
              </h2>
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
                  <p className="text-sm">输入你的问题，AI 助手将为你解答</p>
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
                    <div className="flex-1 space-y-1">
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
                  placeholder="输入你的问题..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
                  className="self-end"
                >
                  {isLoading ? '发送中...' : '发送'}
                </Button>
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
