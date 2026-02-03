import React, { createContext, useContext, useState } from 'react'
import Toast from './Toast'

const ToastContext = createContext({ show: (msg:string, type?:any)=>{} })

export function useToast(){ return useContext(ToastContext) }

export default function ToastProvider({ children }:{children:React.ReactNode}){
  const [toasts, setToasts] = useState<{id:number,type:string,message:string}[]>([])
  function show(message:string, type:'info'|'success'|'error'='info'){
    const id = Date.now()
    setToasts(t=>[...t, {id, type, message}])
    setTimeout(()=> setToasts(t=>t.filter(x=>x.id!==id)), 3000)
  }
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-50">
        {toasts.map(t=> <Toast key={t.id} type={t.type as any} message={t.message} />)}
      </div>
    </ToastContext.Provider>
  )
}
