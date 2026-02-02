import React, { useState } from 'react'
import ApiExplorer from './pages/ApiExplorer'
import ComponentsPage from './pages/ComponentsPage'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App(){
  const [route, setRoute] = useState<'explorer'|'components'|'home'|'login'>('home')
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-4 border-b dark:border-gray-700">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Neuro Front</h1>
          <nav className="flex items-center gap-2">
            <button className={"px-3 py-1 rounded " + (route==='home' ? 'bg-blue-600 text-white' : 'bg-transparent')} onClick={()=>setRoute('home')}>Home</button>
            <button className={"px-3 py-1 rounded " + (route==='explorer' ? 'bg-blue-600 text-white' : 'bg-transparent')} onClick={()=>setRoute('explorer')}>API Explorer</button>
            <button className={"px-3 py-1 rounded " + (route==='components' ? 'bg-blue-600 text-white' : 'bg-transparent')} onClick={()=>setRoute('components')}>Components</button>
            <button className={"px-3 py-1 rounded " + (route==='login' ? 'bg-blue-600 text-white' : 'bg-transparent')} onClick={()=>setRoute('login')}>Login</button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4">
        {route === 'explorer' ? <ApiExplorer /> : route === 'components' ? <ComponentsPage /> : route === 'home' ? <Home /> : <Login /> }
      </main>
    </div>
  )
}
