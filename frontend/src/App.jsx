import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import AuthPage from './auth/AuthPage.jsx'
import ForgotPasswordPage from './auth/ForgotPasswordPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardAI from './pages/DashboardAI.jsx'
import LeatherCatalog from './pages/LeatherCatalog.jsx'
import LeatherDetail from './pages/LeatherDetail.jsx'
import ManageLeather from './pages/ManageLeather.jsx'
import ManageLeatherHistory from './pages/ManageLeatherHistory.jsx'
import AuditTrail from './pages/AuditTrail.jsx'
import SalesTransactions from './pages/SalesTransactions.jsx'

export default function App() {
  return (
    <Routes>
      {/* DEFAULT REDIRECT */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* AUTH ROUTES — No Layout */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* APP ROUTES — With Sidebar Layout (Protected) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardAI />} />
        <Route path="/sales" element={<LeatherCatalog />} />
        <Route path="/sales/:materialId" element={<LeatherDetail />} />
        <Route path="/manage-leather" element={<ManageLeather />} />
        <Route path="/manage-leather/history" element={<ManageLeatherHistory />} />
        <Route path="/audit-trail" element={<AuditTrail />} />
        <Route path="/sales-transactions" element={<SalesTransactions />} />
      </Route>
    </Routes>
  )
}
