export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export function apiPath(path) {
  return `${API_BASE_URL}${path}`
}

export async function getJson(path, options = {}) {
  const res = await fetch(apiPath(path), {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const message = await res.text()
    throw new Error(`API request failed ${res.status}: ${message}`)
  }

  return res.json()
}
