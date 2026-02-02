import React, { useState } from 'react'
import { Button } from '../components'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e:React.FormEvent){
    e.preventDefault()
    // placeholder: call auth API
    alert(`登录: ${email}`)
  }

  return (
    <div className="max-w-md mx-auto card p-6">
      <h2 className="text-xl font-semibold">登录</h2>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <div>
          <label className="block text-sm">邮箱</label>
          <input className="mt-1 w-full px-3 py-2 rounded border" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">密码</label>
          <input type="password" className="mt-1 w-full px-3 py-2 rounded border" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button type="submit">登录</Button>
        </div>
      </form>
    </div>
  )
}
