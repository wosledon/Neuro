import React from 'react'
const logo = '/assets/logo.png'
import { Button } from '../components'

function Stat({label, value}:{label:string; value:string}){
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

export default function Home(){

  return (
    <div className="space-y-8">
      <section className="card flex flex-col md:flex-row items-center gap-6 p-8">
        <div className="flex-1">
          <img src={logo} alt="Neuro" className="w-20 h-20 mb-4" />
          <h1 className="text-4xl font-extrabold leading-tight">Neuro — AI Knowledge & Docs</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-xl">Neuro 是一站式 AI 驱动知识库与文档生成平台，融合向量化检索、RAG（检索增强生成）、自动化 API 文档导出与团队协作工具，帮助产品、工程与文档团队更快交付高质量文档与知识产出。</p>
          <div className="mt-6 flex gap-3">
            <Button variant="primary" className="accent">开始使用</Button>
            <Button variant="secondary">了解更多</Button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-6">
            <Stat label="自动文档" value="一键生成" />
            <Stat label="RAG 检索" value="语义搜索" />
            <Stat label="团队协作" value="审批与版本" />
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
          <h3 className="font-semibold">写文档（AutoDoc）</h3>
          <p className="text-sm text-gray-500 mt-2">从代码注释与知识库中自动生成结构化文档，支持示例请求/响应与多格式导出（Markdown/HTML）。</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">知识库（Vector KB）</h3>
          <p className="text-sm text-gray-500 mt-2">将项目代码、README、设计文档与外部资料向量化索引，实现高质量语义搜索与上下文检索。</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">RAG 检索（Assist）</h3>
          <p className="text-sm text-gray-500 mt-2">检索增强生成（RAG）结合向量数据库与 LLM，生成可解释、带来源的答案与文档片段。</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">向量索引</h3>
          <p className="text-sm text-gray-500 mt-2">高性能 ONNX 向量化器，支持批量与流式处理。</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">文档生成</h3>
          <p className="text-sm text-gray-500 mt-2">从代码注释与知识库生成结构化文档和示例。</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">组件化前端</h3>
          <p className="text-sm text-gray-500 mt-2">React + Vite + TypeScript + Tailwind，统一视觉与可访问性。</p>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold">一键导出与集成</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">连接后端服务、代码仓库与知识源，快速导出文档并同步到 docs 目录或发布为静态站点（开发时可选用 OpenAPI 作为结构化来源）。</p>
        <div className="mt-4 flex gap-3">
          <Button variant="primary">导出文档</Button>
          <Button variant="secondary">同步知识库</Button>
        </div>
      </section>

      <footer className="text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Neuro — AI Knowledge & Docs
      </footer>
    </div>
  )
}
