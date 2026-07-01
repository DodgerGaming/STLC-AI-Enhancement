import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CheckCircle2, Menu, ScanLine, X } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import OrderSummaryModal from '../components/OrderSummaryModal.jsx'
import CartFooter from '../components/CartFooter.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatPeso } from '../utils/format.js'

const PAGE_TITLES = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview of sales, stock, and recent activity.',
  },
  '/sales': {
    title: 'Sales Entry',
    subtitle: 'Browse leather and build the current order.',
  },
  '/sales-transactions': {
    title: 'Sales Transactions',
    subtitle: 'Recent sales records and fulfillment status.',
  },
  '/manage-leather': {
    title: 'Manage Leather',
    subtitle: 'Register incoming stock into the central inventory system.',
  },
  '/manage-leather/history': {
    title: 'Leather History',
    subtitle: 'Review previous updates and batch history.',
  },
  '/audit-trail': {
    title: 'Audit Trail',
    subtitle: 'Trace system activity and recent changes.',
  },
}

export default function MainLayout() {
  const { lastConfirmation, clearConfirmation } = useCart()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [headerActions, setHeaderActions] = useState(null)

  const pageMeta = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/sales/') && location.pathname !== '/sales'
      ? { title: 'Leather Details', subtitle: 'Material details and batch options.' }
      : { title: 'Cutwise IMS', subtitle: 'Sales and cutting leather operations.' })

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
      
      <main className="min-h-screen pb-32 lg:ml-[260px]">
        <header className="border-b border-outline-variant bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg p-2 hover:bg-surface-variant lg:hidden"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div>
                <h1 className="text-xl font-extrabold text-on-surface">{pageMeta.title}</h1>
                <p className="text-sm text-on-surface-variant">{pageMeta.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end">
              {headerActions}
            </div>

            {location.pathname === '/sales' && !headerActions && (
              <button
                type="button"
                disabled
                className="hidden items-center gap-2 rounded-full border border-dashed border-outline-variant bg-surface-variant/40 px-3 py-2 text-xs font-semibold text-on-surface-variant md:flex"
                aria-label="QR scanner placeholder"
              >
                <ScanLine size={14} />
                QR Scanner
                <span className="rounded-full bg-outline-variant/60 px-2 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
              </button>
            )}
          </div>
        </header>
        
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <Outlet context={{ setPageHeaderActions: setHeaderActions }} />
        </div>
      </main>

      <OrderSummaryModal />
      <CartFooter />

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
