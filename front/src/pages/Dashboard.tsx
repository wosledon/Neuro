import React from 'react'
import { Button } from '../components'

export default function Dashboard(){
  return (
    <div>
      <h2 className="text-2xl font-semibold">系统主页</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h4 className="font-medium">知识搜索</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">通过向量检索快速查找知识条目</p>
          <div className="mt-3"><Button variant="primary">开始搜索</Button></div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h4 className="font-medium">文档生成</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">基于代码注释与知识库自动生成文档</p>
          <div className="mt-3"><Button variant="secondary">生成文档</Button></div>
        </div>
      </div>
    </div>
  )
}
