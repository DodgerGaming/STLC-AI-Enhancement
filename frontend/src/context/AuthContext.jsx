import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const authToken = localStorage.getItem('authToken')
    const userEmail = localStorage.getItem('userEmail')
    
    if (authToken && userEmail) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
    setLoading(false)
  }, [])

  const login = (email) => {
    // Create a mock token (replace with real API token)
    const mockToken = 'auth_token_' + Date.now()
    localStorage.setItem('authToken', mockToken)
    localStorage.setItem('userEmail', email)
    setIsAuthenticated(true)
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
