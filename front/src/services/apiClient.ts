export async function fetchSwagger(url = '/swagger/v1/swagger.json'){
  const res = await fetch(url)
  if(!res.ok) throw new Error(`Failed to fetch swagger: ${res.status}`)
  return res.json()
}
