import React, { useState } from 'react'
import { Button } from '../components'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e:React.FormEvent){
    e.preventDefault()
    alert(`登录: ${email}`)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 flex flex-col items-start justify-center bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
          <img src="/assets/logo.png" alt="logo" className="w-24 h-24 mb-4 rounded-full bg-white/10 p-2" />
          <h2 className="text-3xl font-extrabold">欢迎回到 Neuro</h2>
          <p className="mt-2 max-w-sm">基于 AI 的知识库与文档生成平台，让团队更快产出可搜索、可维护的文档。</p>
          <div className="mt-6">
            <ul className="text-sm opacity-90">
              <li>• 快速语义检索</li>
              <li>• 一键生成 API 文档</li>
              <li>• RAG 驱动的智能问答</li>
            </ul>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <form className="space-y-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg" onSubmit={submit}>
              <div>
                <label className="block text-sm">邮箱</label>
                <input className="mt-1 w-full px-3 py-2 rounded border" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">密码</label>
                <input type="password" className="mt-1 w-full px-3 py-2 rounded border" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input id="remember" type="checkbox" className="h-4 w-4" />
                  <label htmlFor="remember" className="text-sm text-gray-600">记住我</label>
                </div>
                <a href="#" className="text-sm text-blue-600">忘记密码?</a>
              </div>
              <div>
                <Button type="submit" variant="primary" className="w-full">登录</Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">还没有账号？ <a href="#" className="text-blue-600">注册</a></div>
          </div>
        </div>
      </div>
    </div>
  )
}
