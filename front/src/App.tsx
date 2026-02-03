import React, { useState, useEffect } from 'react'
import ComponentsPage from './pages/ComponentsPage'
import Home from './pages/Home'
import Login from './pages/Login'
import Header from './components/Header'

type Route = 'components' | 'home' | 'login'

export default function App(){
  const [route, setRoute] = useState<Route>('home')
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
  const baseClasses = `min-h-screen text-gray-900 dark:text-gray-100 ${isFullScreen ? 'bg-slate-950' : 'bg-gray-50 dark:bg-gray-900'}`
  return (
    <div className={baseClasses}>
      {!isFullScreen && (
        <Header
          activeRoute={route}
          onNavigate={(next: Route) => setRoute(next)}
          onToggleTheme={() => setDarkMode(!darkMode)}
          isDark={darkMode}
        />
      )}
      {isFullScreen ? (
        <Login onBack={()=>setRoute('home')} />
      ) : (
        <div className="page-content container mx-auto">
          <main className="space-y-10">
            <div key={route} className="transition-opacity duration-300 ease-in-out page-enter page-enter-active">
              {route === 'components' ? <ComponentsPage /> : <Home /> }
            </div>
          </main>
        </div>
      )}
    </div>
  )
}
