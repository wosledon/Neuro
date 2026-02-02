import React, { useState, useEffect } from 'react'
import ComponentsPage from './pages/ComponentsPage'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'

function ThemeToggle({darkMode, setDarkMode}:{darkMode:boolean; setDarkMode:(v:boolean)=>void}){
  return (
    <button onClick={()=>setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 theme-icon focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-400">
      {darkMode ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
    </button>
  )
}

export default function App(){
  const [route, setRoute] = useState<'components'|'home'|'login'>('home')
  // when on login route, render login as standalone full page
  const isFullScreen = route === 'login'
  const [darkMode, setDarkMode] = useState<boolean>(()=>{
    try{ return localStorage.getItem('theme') === 'dark' }catch{ return false }
  })
  useEffect(()=>{
    const root = document.documentElement
    if(darkMode) root.classList.add('dark')
    else root.classList.remove('dark')
    try{ localStorage.setItem('theme', darkMode ? 'dark' : 'light') }catch{}
  },[darkMode])
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-4 border-b dark:border-gray-700">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3"><img src="/assets/logo.png" alt="logo" className="w-8 h-8"/><span className="text-2xl font-semibold">Neuro</span></div>
          <nav className="flex items-center gap-2">
            
            <button className={"px-3 py-1 rounded " + (route==='home' ? 'bg-blue-600 text-white' : 'bg-transparent')} onClick={()=>setRoute('home')}>Home</button>
                        <button className={"px-3 py-1 rounded " + (route==='components' ? 'bg-blue-600 text-white' : 'bg-transparent')} onClick={()=>setRoute('components')}>Components</button>
            <button className={"px-3 py-1 rounded " + (route==='login' ? 'bg-blue-600 text-white' : 'bg-transparent')} onClick={()=>setRoute('login')}>Login</button>
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          </nav>
        </div>
      </header>
      {isFullScreen ? (
        <div className="min-h-screen">
          <Login />
        </div>
      ) : (
        <main className="container mx-auto p-4">
          <div className="relative">
            <div key={route} className="transition-opacity duration-300 ease-in-out page-enter page-enter-active">

          {route === 'components' ? <ComponentsPage /> : <Home /> }
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
