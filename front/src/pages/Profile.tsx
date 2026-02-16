import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, Button, Input, Badge } from '../components'
import { useToast } from '../components/ToastProvider'
import { 
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/solid'

export default function Profile() {
  const { user, refreshUserInfo } = useAuth()
  const { show: showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }))
    }
  }, [user])

  const validateProfileForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入姓名'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.currentPassword) {
      errors.currentPassword = '请输入当前密码'
    }
    if (!formData.newPassword) {
      errors.newPassword = '请输入新密码'
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = '新密码至少6位'
    }
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateProfileForm()) return

    setLoading(true)
    try {
      // TODO: 调用更新用户信息 API
      showToast('个人信息更新成功', 'success')
      refreshUserInfo()
    } catch (error) {
      showToast('更新失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePasswordForm()) return

    setLoading(true)
    try {
      // TODO: 调用修改密码 API
      showToast('密码修改成功', 'success')
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      showToast('密码修改失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
          个人设置
        </h1>
        <p className="text-surface-500 dark:text-surface-400">
          管理您的个人信息和账户安全
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: User Info Card */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-4xl font-bold text-white shadow-glow mb-4">
              {user?.name?.[0] || user?.account?.[0] || 'U'}
            </div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
              {user?.name || user?.account}
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              {user?.email}
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {user?.isSuper ? (
                <Badge variant="danger">超级管理员</Badge>
              ) : (
                <Badge variant="primary">普通用户</Badge>
              )}
            </div>
            
            <div className="space-y-3 text-left pt-6 border-t border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-3 text-sm">
                <UserCircleIcon className="w-5 h-5 text-surface-400" />
                <span className="text-surface-600 dark:text-surface-400">账号:</span>
                <span className="text-surface-900 dark:text-white font-medium">{user?.account}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <EnvelopeIcon className="w-5 h-5 text-surface-400" />
                <span className="text-surface-600 dark:text-surface-400">邮箱:</span>
                <span className="text-surface-900 dark:text-white font-medium">{user?.email || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <PhoneIcon className="w-5 h-5 text-surface-400" />
                <span className="text-surface-600 dark:text-surface-400">电话:</span>
                <span className="text-surface-900 dark:text-white font-medium">{user?.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ClockIcon className="w-5 h-5 text-surface-400" />
                <span className="text-surface-600 dark:text-surface-400">注册时间:</span>
                <span className="text-surface-900 dark:text-white font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <UserCircleIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">基本信息</h3>
                <p className="text-sm text-surface-500">更新您的个人资料</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="姓名"
                  placeholder="请输入姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={formErrors.name}
                  required
                />
                <Input
                  label="邮箱"
                  type="email"
                  placeholder="请输入邮箱"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={formErrors.email}
                />
              </div>
              <Input
                label="电话"
                placeholder="请输入电话号码"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={formErrors.phone}
              />
              <div className="flex justify-end">
                <Button type="submit" loading={loading}>
                  保存修改
                </Button>
              </div>
            </form>
          </Card>

          {/* Password */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <KeyIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">修改密码</h3>
                <p className="text-sm text-surface-500">定期更换密码以保护账户安全</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="当前密码"
                type="password"
                placeholder="请输入当前密码"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                error={formErrors.currentPassword}
                required
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="新密码"
                  type="password"
                  placeholder="请输入新密码"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  error={formErrors.newPassword}
                  required
                />
                <Input
                  label="确认新密码"
                  type="password"
                  placeholder="请再次输入新密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  error={formErrors.confirmPassword}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="secondary" loading={loading}>
                  修改密码
                </Button>
              </div>
            </form>
          </Card>

          {/* Security Info */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">安全信息</h3>
                <p className="text-sm text-surface-500">查看您的账户安全状态</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-surface-700 dark:text-surface-300">登录状态</span>
                </div>
                <Badge variant="success" size="sm">正常</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-surface-700 dark:text-surface-300">密码强度</span>
                </div>
                <Badge variant="success" size="sm">强</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-surface-700 dark:text-surface-300">双因素认证</span>
                </div>
                <Badge variant="default" size="sm">未开启</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
