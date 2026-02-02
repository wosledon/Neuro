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
      <div className="card max-w-2xl w-full grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 flex flex-col items-start justify-center">
          <img src="/assets/logo.png" alt="logo" className="w-20 h-20 mb-4" />
          <h2 className="text-2xl font-bold">欢迎回到 Neuro</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">基于 AI 的知识库与文档生成平台</p>
          <div className="mt-6">
            <ul className="text-sm text-gray-500">
              <li>• 快速搜索项目知识</li>
              <li>• 自动生成接口文档</li>
              <li>• 团队协作友好</li>
            </ul>
          </div>
        </div>
        <div className="p-8 border-l md:border-l-0 md:border-l border-gray-100 dark:border-gray-700">
          <form className="space-y-4" onSubmit={submit}>
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
            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full">登录</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
