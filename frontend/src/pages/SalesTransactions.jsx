import { useEffect, useState } from 'react'
import StatusPill from '../components/StatusPill.jsx'
import { fetchOrders } from '../data/apiLeather.js'
import { formatPeso } from '../utils/format.js'

export default function SalesTransactions() {
  const [sales, setSales] = useState([])
  const [activeTab, setActiveTab] = useState('Delivery')

  const normalizeFulfillment = (value) => {
    const v = (value || '').toLowerCase().trim()
    if (v.includes('pick')) return 'pickup'
    if (v.includes('deliv')) return 'delivery'
    return v
  }

  useEffect(() => {
    let mounted = true
    fetchOrders()
      .then((data) => {
        if (!mounted || !Array.isArray(data)) return
        const mapped = data.map((o) => ({
          order_id: o.order_id,
          customer: o.customer,
          material: (o.items && o.items.length > 0) ? o.items.map((it) => it.material_name).join(', ') : '—',
          qty: o.item_count || (o.items && o.items.reduce((s, it) => s + (it.qty || 0), 0)) || 0,
          total: o.total || 0,
          address: o.delivery_address || o.address || '—',
          description: o.order_description || '—',
          paymentMethod: o.payment_method || '—',
          status: o.status || 'Pending',
          fulfillment: o.fulfillment,
          scheduledDate: o.scheduled_date,
          scheduledTime: o.scheduled_time,
          createdAt: o.created_at,
        }))
        setSales(mapped)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const visibleSales = sales.filter((s) => normalizeFulfillment(s.fulfillment) === normalizeFulfillment(activeTab)).slice(0, 5)

  return (
    <div>
      <div className="mt-2 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Recent Transactions</h3>
            <p className="text-xs text-on-surface-variant">Toggle between delivery and pickup results.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Delivery', 'Pick-up'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setActiveTab(option)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                  activeTab === option
                    ? 'bg-primary text-surface'
                    : 'border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-auto text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-variant/60 font-semibold text-on-surface-variant">
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Order ID</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Customer</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Material</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Qty</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Total</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Fulfillment</th>
                {normalizeFulfillment(activeTab) === 'delivery' && (
                  <>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-5">Address</th>
                    <th className="px-3 py-3 sm:px-5">Description</th>
                  </>
                )}
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Payment</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleSales.map((sale) => (
                <tr key={sale.order_id} className="border-b border-outline-variant last:border-0">
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-on-surface sm:px-5">{sale.order_id}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.customer}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.material}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.qty}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-on-surface sm:px-5">{formatPeso(sale.total)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.fulfillment || '—'}</td>
                  {normalizeFulfillment(activeTab) === 'delivery' && (
                    <>
                      <td className="max-w-[220px] truncate px-3 py-3 text-on-surface-variant sm:px-5" title={sale.address}>{sale.address || '—'}</td>
                      <td className="max-w-[260px] truncate px-3 py-3 text-on-surface-variant sm:px-5" title={sale.description}>{sale.description || '—'}</td>
                    </>
                  )}
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.paymentMethod || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 sm:px-5"><StatusPill status={sale.status} /></td>
                </tr>
              ))}
              {visibleSales.length === 0 && (
                <tr>
                  <td colSpan={normalizeFulfillment(activeTab) === 'pickup' ? 10 : 12} className="px-3 py-8 text-center text-xs text-on-surface-variant sm:px-5 sm:text-sm">No {activeTab.toLowerCase()} transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
