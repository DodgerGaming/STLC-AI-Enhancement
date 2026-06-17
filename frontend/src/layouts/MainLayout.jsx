import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CheckCircle2, Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import OrderSummaryModal from '../components/OrderSummaryModal.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatPeso } from '../utils/format.js'

export default function MainLayout() {
  const { lastConfirmation, clearConfirmation } = useCart()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!lastConfirmation) return
    const timer = setTimeout(clearConfirmation, 4000)
    return () => clearTimeout(timer)
  }, [lastConfirmation, clearConfirmation])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <main className="min-h-screen lg:ml-[260px]">
        {/* Header with hamburger */}
        <div className="flex items-center gap-3 border-b border-outline-variant bg-surface px-4 py-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 hover:bg-surface-variant"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <p className="text-lg font-extrabold text-primary-dark">Cutwise IMS</p>
        </div>
        
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <OrderSummaryModal />

      {lastConfirmation && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-primary-dark px-5 py-3 text-surface shadow-popover">
          <CheckCircle2 size={18} className="text-success" />
          <p className="text-sm">
            <span className="font-bold">Sale saved</span> — {lastConfirmation.transactionId} ·{' '}
            {formatPeso(lastConfirmation.total)}
          </p>
        </div>
      )}
    </div>
  )
}
