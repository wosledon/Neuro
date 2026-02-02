import React from 'react'
import logo from '../assets/logo.png'
import { Button } from '../components'

export default function Home(){
  return (
    <div className="space-y-8">
      <section className="flex items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded shadow">
        <img src={logo} alt="Neuro" className="w-24 h-24" />
        <div>
          <h2 className="text-3xl font-bold">Neuro — AI Knowledge & Docs</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">构建基于向量检索的知识库并使用 AI 自动生成项目文档。</p>
          <div className="mt-4 flex gap-3">
            <Button variant="primary">立即体验</Button>
            <Button variant="secondary">查看组件</Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <Feature title="向量索引" desc="基于 ONNX 的向量化器，支持多模型" />
        <Feature title="文档生成" desc="从 swagger & 代码注释生成 Markdown 文档" />
        <Feature title="组件化前端" desc="React + Vite + TypeScript + Tailwind" />
      </section>
    </div>
  )
}

function Feature({title, desc}:{title:string; desc:string}){
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{desc}</p>
    </div>
  )
}
