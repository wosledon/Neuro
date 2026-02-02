import React from 'react'
const logo = '/assets/logo.png'
import { Button } from '../components'

export default function Home(){
  return (
    <div className="space-y-8">
      <section className="card flex flex-col md:flex-row items-center gap-6 p-8">
        <div className="flex-1">
          <img src={logo} alt="Neuro" className="w-20 h-20 mb-4" />
          <h1 className="text-4xl font-extrabold leading-tight">Neuro — AI Knowledge & Docs</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-xl">打造一个以向量检索为核心的知识库，结合自动化文档生成，帮助团队更快理解与维护项目。</p>
          <div className="mt-6 flex gap-3">
            <Button variant="primary" className="accent">开始使用</Button>
            <Button variant="secondary">查看组件</Button>
          </div>
          <div className="mt-6 flex gap-6">
            <div>
              <div className="text-2xl font-bold">99+</div>
              <div className="text-sm text-gray-500">文档自动生成</div>
            </div>
            <div>
              <div className="text-2xl font-bold">10k+</div>
              <div className="text-sm text-gray-500">知识条目索引</div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/3">
          <div className="rounded-xl overflow-hidden accent p-6 flex items-center justify-center" style={{height:240}}>
            <img src={logo} alt="logo" className="w-24 h-24 opacity-90" />
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="card p-6">
          <h3 className="font-semibold">向量索引</h3>
          <p className="text-sm text-gray-500 mt-2">高性能 ONNX 向量化器，支持批量与流式处理。</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">文档生成</h3>
          <p className="text-sm text-gray-500 mt-2">从 Swagger、注释与知识库生成结构化文档和示例。</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">组件化前端</h3>
          <p className="text-sm text-gray-500 mt-2">React + Vite + TypeScript + Tailwind，统一视觉与可访问性。</p>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold">准备就绪</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">后端已启动，使用 OpenAPI 驱动的 API Explorer 与自动化文档生成工具来导出文档。</p>
        <div className="mt-4">
          <Button variant="primary">导出文档</Button>
        </div>
      </section>

      <footer className="text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Neuro — AI Knowledge & Docs
      </footer>
    </div>
  )
}
