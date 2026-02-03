import React, { useState } from 'react'
import { Button } from '../components'

type Props = {
  onBack: () => void
}

const tokenStyles = [
  { label: 'Insight Token', color: 'from-cyan-400/70 to-sky-500/50' },
  { label: 'Atlas Token', color: 'from-purple-400/70 to-fuchsia-500/50' },
  { label: 'Neuro Grid', color: 'from-amber-400/80 to-orange-500/60' }
]

export default function Login({ onBack }: Props){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e:React.FormEvent){
    e.preventDefault()
    alert(`登录: ${email}`)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-sky-600 to-cyan-500 text-white overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute h-[420px] w-[420px] rounded-full bg-gradient-to-br from-white/30 via-indigo-400/40 to-transparent blur-3xl -right-16 top-10" />
        <div className="absolute h-[500px] w-[500px] rounded-full bg-gradient-to-br from-white/20 via-sky-400/30 to-transparent blur-3xl -bottom-28 left-8" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-6 py-8 lg:flex-row lg:items-stretch lg:gap-10">
        <section className="flex flex-1 flex-col justify-center space-y-6 rounded-[32px] border border-white/30 bg-white/10 p-10 shadow-[0_25px_80px_rgba(15,23,42,0.75)] backdrop-blur-xl mb-6 lg:mb-0">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Neuro</p>
            <h1 className="mt-5 text-5xl font-bold leading-tight text-white lg:text-6xl">
              让知识与 AI 真正流动
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-300">
              Neuro 将您的文档、API、PR 讨论与向量数据库连成一张网，提供沉浸式的导航与实时洞察。登录后，立即开启自己的智能协作空间。
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {tokenStyles.map(token => (
              <div key={token.label} className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 shadow-[0_10px_40px_rgba(15,23,42,0.4)]">
                <span className={`inline-flex rounded-full bg-gradient-to-r ${token.color} px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.4em] text-white`}>
                  {token.label}
                </span>
              </div>
            ))}
          </div>
          <div className="max-w-sm space-y-3 text-sm text-slate-300">
            <p>· 实时同步代码仓库，并由神经搜索自动生成结构化文档</p>
            <p>· RAG 驱动的问答搭配向量化器模型即刻处理任意上下文</p>
            <p>· 智能审计流水线覆盖 PR 评论、API 变更、知识图谱更新</p>
          </div>
        </section>

        <section className="flex flex-col rounded-[28px] border border-white/10 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.4)] text-slate-900 lg:max-w-md">
          <button onClick={onBack} className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:text-slate-700">返回首页</button>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-900">登录你的神经网络</h2>
            <p className="text-sm text-slate-600">
              快速解锁团队共享的 AI 工作区，所有 token 与向量数据都会经过透明审计。
            </p>
          </div>
          <form className="mt-6 space-y-5" onSubmit={submit}>
              <div className="space-y-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                <label>邮箱</label>
                <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-3xl border border-slate-300/50 bg-white/70 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 tracking-normal"
                placeholder="name@neuro.ai"
              />
            </div>
              <div className="space-y-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                <label>密码</label>
                <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-3xl border border-slate-300/50 bg-white/70 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 tracking-normal"
                placeholder="••••••••••"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-300" />
                记住设备
              </label>
              <a href="#" className="text-cyan-600 transition hover:text-cyan-700">忘记密码?</a>
            </div>
            <Button type="submit" variant="primary" className="w-full rounded-3xl py-3 text-sm font-semibold uppercase tracking-[0.25em]">立即登录</Button>
          </form>
          <p className="mt-5 text-center text-[0.65rem] uppercase tracking-[0.6em] text-slate-500">
            还没有账号？ <a className="text-cyan-600 hover:text-cyan-700">申请试用</a>
          </p>
        </section>
      </div>
    </div>
  )
}
