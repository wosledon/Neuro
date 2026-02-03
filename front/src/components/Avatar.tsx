import React from 'react'

export default function Avatar({src, alt}:{src?:string; alt?:string}){
  return <img src={src} alt={alt} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100 dark:border-gray-800" />
}
