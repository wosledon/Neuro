import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getCurrentUser, getMyPermissions, getMyMenus, login as authLogin, logout as authLogout, LoginResult } from '../services/auth'

interface User {
  id: string
  account: string
  name: string
  email: string
  phone: string
  isSuper: boolean
}

interface Menu {
  id: string
  name: string
  code: string
  url: string
  icon: string
  parentId?: string
  treePath: string
  sort: number
  children: Menu[]
}

interface AuthContextType {
  user: User | null
  permissions: string[]
  menus: Menu[]
  isLoading: boolean
  isAuthenticated: boolean
  login: (account: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (code: string) => boolean
  refreshUserInfo: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const refreshUserInfo = useCallback(async () => {
    try {
      const [userData, perms, menuData] = await Promise.all([
        getCurrentUser(),
        getMyPermissions(),
        getMyMenus(),
      ])
      setUser(userData as User)
      setPermissions(perms)
      setMenus(menuData as Menu[])
    } catch (error) {
      console.error('Failed to refresh user info:', error)
      setUser(null)
      setPermissions([])
      setMenus([])
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      refreshUserInfo().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [refreshUserInfo])

  const login = async (account: string, password: string) => {
    const result: LoginResult = await authLogin(account, password)
    localStorage.setItem('access_token', result.accessToken)
    localStorage.setItem('refresh_token', result.refreshToken)
    await refreshUserInfo()
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        await authLogout(refreshToken)
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setPermissions([])
    setMenus([])
  }

  const hasPermission = useCallback((code: string) => {
    if (user?.isSuper) return true
    return permissions.includes(code)
  }, [user, permissions])

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        menus,
        isLoading,
        isAuthenticated,
        login,
        logout,
        hasPermission,
        refreshUserInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
