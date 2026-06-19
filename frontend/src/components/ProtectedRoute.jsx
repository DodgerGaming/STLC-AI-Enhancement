import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-on-surface-variant">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Role-based redirect: Clerks should not access admin pages like /dashboard, /manage-leather, /audit-trail
  const userRole = localStorage.getItem('userRole') || 'Clerk'
  const location = useLocation()
  const path = location.pathname || '/'

  const adminPaths = ['/dashboard', '/manage-leather', '/audit-trail']
  if (userRole === 'Clerk' && adminPaths.some((p) => path.startsWith(p))) {
    return <Navigate to="/sales" replace />
  }

  return children
}
