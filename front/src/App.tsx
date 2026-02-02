import React from 'react'
import ApiExplorer from './pages/ApiExplorer'

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-4 border-b dark:border-gray-700">
        <div className="container mx-auto">
          <h1 className="text-2xl font-semibold">Neuro Front — API Explorer</h1>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <ApiExplorer />
      </main>
    </div>
  )
}
