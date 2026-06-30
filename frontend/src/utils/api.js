const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_PATH = (path) => `${API_BASE}/api${path}`

export async function fetchJson(path, init = {}) {
  const url = API_PATH(path)
  const headers = {
    'Content-Type': 'application/json',
    ...init.headers,
  }

  const userEmail = localStorage.getItem('userEmail')
  if (userEmail) {
    headers['X-User-Email'] = userEmail
  }

  const options = {
    headers,
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
