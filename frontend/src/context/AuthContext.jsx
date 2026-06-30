import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_PATH = (path) => `${API_BASE}/api${path}`

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const authToken = localStorage.getItem('authToken')
    const userEmail = localStorage.getItem('userEmail')
    const userRole = localStorage.getItem('userRole')
    
    if (authToken && userEmail) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Call backend login API
    const res = await fetch(API_PATH('/authentication/login/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Login failed')
    }

    const data = await res.json()
    // backend returns { success: true, user: { ... } }
    const user = data.user
    const token = 'auth_token_' + Date.now()
    localStorage.setItem('authToken', token)
    localStorage.setItem('userEmail', user.email)
    localStorage.setItem('userRole', user.role)
    localStorage.setItem('userId', user.id)
    setIsAuthenticated(true)
    return user
  }

  const logout = () => {
    // Clear all localStorage
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear auth state
    setIsAuthenticated(false)
    
    // Clear browser history
    window.history.pushState(null, null, '/login')
    window.history.go(-window.history.length)
    
    // Redirect to login
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
