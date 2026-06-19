const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_PATH = (path) => `${API_BASE}/api${path}`

export async function fetchJson(path, init = {}) {
  const url = API_PATH(path)
  const options = {
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    ...init,
  }

  const response = await fetch(url, options)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.detail || data?.error || 'API request failed'
    throw new Error(message)
  }

  return data
}
