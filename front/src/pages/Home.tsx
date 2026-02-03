import React from 'react'
import { Button, Card } from '../components'

const stats = [
  { label: '知识文档条目', value: '1.3M+' },
  { label: '智能问答命中率', value: '98%' },
  { label: '文档生成分钟/页', value: '< 2' }
]

const features = [
  {
    title: 'AutoDoc 智能写作',
    summary: '从代码、README 与设计文档自动抽取结构化段落、示例请求与响应，并生成 Markdown/HTML/Confluence 模板。',
    tag: 'DocOps'
  },
  {
    title: '向量知识库',
    summary: '支持多源同步（仓库、PR、Notion、PDF），向量化存储 + 元数据标签，快速定位任意概念。',
    tag: 'Vector KB'
  },
  {
    title: 'RAG 驱动问答',
    summary: '结合神经语义搜索与 LLM 生成，提供带来源的答案、解释链路与对话记忆。',
    tag: 'Assist'
  },
  {
    title: '多模态分析',
    summary: '读取 Onnx 向量化器、PDF、HTML、截图，统一建模与对比，呈现趋势与知识裂变。',
    tag: 'Insights'
  }
]

const pillars = [
  { title: '自动化流水线', body: 'CI/CD 触发同步 + swagger 文档更新后自动生成 API 概览页与变更史。' },
  { title: '可解释输出', body: '输出带来源的文档和答案，自动附上引用段落、文件路径与责任人。' },
  { title: '团队协作', body: '内建审批链、版本历史与评论，保障文档由研发到产品流转顺畅。' }
]

export default function Home(){
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-600 via-sky-600 to-cyan-500 text-white shadow-2xl">
        <div className="pointer-events-none absolute inset-y-0 right-[-6rem] hidden md:block">
          <div className="h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-6 py-12 md:px-10 md:py-16">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-indigo-100/80">
                <span className="h-0.5 flex-1 bg-white/60" />Neuro Studio<em>2026</em>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                AI 驱动的知识库与文档中心，帮团队将每一段代码变成可检索、可解释、可交付的知识资产。
              </h1>
              <p className="text-lg text-indigo-100/90 max-w-2xl">
                从 swagger.json、代码注释与设计稿中提取语义，自动构建文档、知识卡片与 RAG 场景，让研发、产品、文档团队在一个平台内完成知识共享与落地。
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" className="px-6 py-3 shadow-xl">立即体验</Button>
                <Button variant="secondary" className="px-6 py-3">观看演示</Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-10">
                {stats.map(stat => (
                  <div key={stat.label}>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-sm text-indigo-100/80">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 lg:mt-0 rounded-[28px] bg-white/10 p-8 shadow-[0_30px_60px_rgba(15,23,42,0.4)] ring-1 ring-white/40 border border-white/30 backdrop-blur">
              <p className="text-xs uppercase text-white/70">实时洞察</p>
              <div className="mt-6 space-y-6">
                <div className="rounded-2xl bg-white/20 p-4">
                  <div className="text-sm text-white/90">文档完成度</div>
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-xs text-white/60">比上周提升 18%</div>
                </div>
                <div className="rounded-2xl bg-white/20 p-4">
                  <div className="text-sm text-white/90">RAG 命中率</div>
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-xs text-white/60">500ms 内完成检索</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl space-y-8 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">功能亮点</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              以 RAG 做底座，集成 AutoDoc、Vector KB 与文档自动化，降本、提速并保证所有知识有据可查。
            </p>
          </div>
          <Button variant="ghost" className="text-indigo-600 dark:text-indigo-400">
            查看产品地图 →
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map(feature => (
            <Card key={feature.title} className="transform transition hover:-translate-y-1">
              <div className="text-xs font-semibold tracking-normal uppercase text-indigo-500">{feature.tag}</div>
              <h3 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{feature.summary}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-6xl grid gap-6 lg:grid-cols-[2fr_1fr] items-stretch">
        <div className="space-y-6 rounded-[28px] border border-indigo-100/50 bg-white/70 p-8 shadow-xl backdrop-blur dark:bg-gray-900/70 dark:border-gray-800">
          <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase text-indigo-500">Workflow</p>
              <h3 className="text-2xl font-bold">如何在 Neuro 中落地知识</h3>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-300">自动同步 + AI 尽职</div>
          </div>
          <div className="grid gap-4">
            {pillars.map((pillar, index) => (
              <div key={pillar.title} className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-800 border border-transparent hover:border-indigo-200 transition">
                <div className="text-sm text-indigo-500">Step {index + 1}</div>
                <h4 className="text-lg font-semibold">{pillar.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
          <div className="rounded-[28px] border border-indigo-100/60 bg-gradient-to-b from-indigo-50 to-white p-8 shadow-xl">
          <div className="text-sm uppercase text-gray-400">客户故事</div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">“Neuro 帮助我们将 150+ 页的 API 文档压缩为 3 分钟可读的提案，并将知识索引到内部助理。”</p>
          <div className="mt-6 text-sm text-gray-600">- 前端治理团队 @银河科技</div>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span>实时同步 Swagger → 知识卡</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>自动生成训练集与 QnA</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              <span>单击即可导出 Markdown/HTML</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl rounded-[32px] border border-gray-200/70 bg-white/60 px-8 py-10 sm:px-10 lg:px-12 shadow-2xl backdrop-blur dark:bg-gray-900/40 dark:border-gray-800">
        <div className="flex flex-col-reverse gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1 space-y-4">
            <p className="text-sm uppercase text-indigo-500">Neuro 赋能</p>
            <h3 className="text-3xl font-bold tracking-tight">将知识 instill 到每个产品上线流程中</h3>
            <p className="max-w-2xl text-gray-600 dark:text-gray-300">
              用 AI 完成核心文档、知识检索与 RAG 问答，确保信息不再散落在 Slack/Confluence/代码中。Neuro 可无缝集成 OpenAPI 与多源数据，以可复用组件展示给你的团队。
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Button variant="primary" className="px-6 py-3 min-w-[180px] shadow-xl">预约体验顾问</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
