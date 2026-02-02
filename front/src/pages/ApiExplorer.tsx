import React, { useEffect, useState } from 'react'

type Swagger = {
  info?: { title?: string; version?: string }
  paths?: Record<string, Record<string, any>>
}

export default function ApiExplorer(){
  const [swagger, setSwagger] = useState<Swagger | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ path: string; method: string } | null>(null)

  useEffect(()=>{
    const url = '/swagger/v1/swagger.json'
    fetch(url).then(async res => {
      if(!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
      const j = await res.json()
      setSwagger(j)
    }).catch(e=>{
      setError(String(e))
    })
  },[])

  if(error) return <div className="text-red-600">Error: {error}</div>
  if(!swagger) return <div>Loading swagger.json from /swagger/v1/swagger.json ...</div>

  const paths = Object.entries(swagger.paths || {})

  return (
    <div className="grid grid-cols-3 gap-4">
      <aside className="col-span-1 p-2 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="text-lg font-medium">{swagger.info?.title || 'API'} {swagger.info?.version && <span className="text-sm text-gray-500">v{swagger.info.version}</span>}</h2>
        <ul className="mt-4 space-y-2 max-h-[70vh] overflow-auto">
          {paths.map(([path, methods])=> (
            <li key={path}>
              <div className="text-sm font-medium">{path}</div>
              <div className="flex gap-2 mt-1">
                {Object.keys(methods).map(m=> (
                  <button key={m} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs" onClick={()=>setSelected({path, method:m})}>{m.toUpperCase()}</button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <section className="col-span-2 p-4 bg-white dark:bg-gray-800 rounded shadow">
        {selected ? (
          <OperationDetail path={selected.path} method={selected.method} operation={swagger.paths?.[selected.path]?.[selected.method]} />
        ) : (
          <div className="text-gray-500">Select an operation to view details</div>
        )}
      </section>
    </div>
  )
}

function OperationDetail({path, method, operation}:{path:string; method:string; operation:any}){
  if(!operation) return <div>No operation data</div>
  return (
    <div>
      <h3 className="text-xl font-semibold">{method.toUpperCase()} {path}</h3>
      <p className="mt-2 text-sm text-gray-500">{operation.summary || operation.description}</p>

      {operation.parameters && (
        <div className="mt-4">
          <h4 className="font-medium">Parameters</h4>
          <ul className="mt-2 space-y-2">
            {operation.parameters.map((p:any, i:number)=> (
              <li key={i} className="text-sm">
                <div className="font-medium">{p.name} <span className="text-xs text-gray-500">({p.in})</span></div>
                <div className="text-gray-600">{p.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {operation.responses && (
        <div className="mt-4">
          <h4 className="font-medium">Responses</h4>
          <pre className="mt-2 overflow-auto text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">{JSON.stringify(operation.responses, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
