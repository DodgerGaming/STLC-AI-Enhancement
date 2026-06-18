import { useState } from 'react'
import { Wallet, Layers, ShoppingCart, AlertTriangle } from 'lucide-react'
import KpiCard from '../components/KpiCard.jsx'
import StatusPill from '../components/StatusPill.jsx'
import SalesByTypeBarChart from '../components/SalesByTypeBarChart.jsx'
import RevenueShareDonutChart from '../components/RevenueShareDonutChart.jsx'
import { dashboardKpis, salesByTypeData, revenueShareData, recentSales, SCRAP_UNIT } from '../data/mockLeather.js'
import { formatPeso, formatNumber } from '../utils/format.js'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Delivery')
  const [sales, setSales] = useState(recentSales)
  const [editingSale, setEditingSale] = useState(null)
  const RECENT_LIMIT = 5

  const normalizeFulfillment = (value) => (value || '').toLowerCase().replace(/-/g, '')

  const visibleSales = sales
    .filter((sale) => normalizeFulfillment(sale.fulfillment) === normalizeFulfillment(activeTab))
    .slice(0, RECENT_LIMIT)

  const openEditModal = (sale) => setEditingSale({ ...sale })
  const closeEditModal = () => setEditingSale(null)

  const handleSaveEdit = () => {
    if (!editingSale) return
    setSales((prev) => prev.map((sale) => (sale.order_id === editingSale.order_id ? editingSale : sale)))
    closeEditModal()
  }

  const deleteSale = (orderId) => {
    setSales((prev) => prev.filter((sale) => sale.order_id !== orderId))
    if (editingSale?.order_id === orderId) closeEditModal()
  }

  const handleEditChange = (field, value) => {
    setEditingSale((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-extrabold text-on-surface">Dashboard</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Overview of leather sales performance.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatPeso(dashboardKpis.totalRevenue)}
          subtitle="This month"
          icon={Wallet}
          trend={{ direction: 'up', value: '+12.4%' }}
        />
        <KpiCard
          label="Leather Sold"
          value={`${formatNumber(dashboardKpis.leatherSoldSqft)} sqft + ${formatNumber(
            dashboardKpis.leatherSoldKg,
          )} ${SCRAP_UNIT}`}
          subtitle="Across all materials"
          icon={Layers}
        />
        <KpiCard
          label="Total Orders"
          value={formatNumber(dashboardKpis.totalOrders)}
          subtitle="This month"
          icon={ShoppingCart}
        />
        <KpiCard
          label="Low Stock Items"
          value={formatNumber(dashboardKpis.lowStockItems)}
          subtitle="Need restocking"
          icon={AlertTriangle}
          tone={dashboardKpis.lowStockItems > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SalesByTypeBarChart data={salesByTypeData} />
        <RevenueShareDonutChart data={revenueShareData} />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-outline-variant px-4 py-4 sm:gap-4 sm:px-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Recent Transactions</h3>
            <p className="text-xs text-on-surface-variant">Toggle between delivery and pickup results. Scroll right for more details &rarr;</p>
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

        {/* Horizontal scroll wrapper: table keeps a min-width so columns keep their
            natural size (no squeezed/cut-off text). User scrolls sideways instead. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] table-auto text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-variant/60 font-semibold text-on-surface-variant">
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Order ID</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Customer</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Material</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Qty</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Total</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Created At</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Schedule</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Address</th>
                <th className="px-3 py-3 sm:px-5">Description</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Payment</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Status</th>
                <th className="whitespace-nowrap px-3 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleSales.map((sale) => (
                <tr key={sale.order_id} className="border-b border-outline-variant last:border-0">
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-on-surface sm:px-5">{sale.order_id}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.customer}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.material}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.qty}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-on-surface sm:px-5">
                    {formatPeso(sale.total)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.createdAt || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">
                    {sale.scheduledDate || sale.scheduledTime
                      ? `${sale.scheduledDate || ''} ${sale.scheduledTime || ''}`.trim()
                      : '—'}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-3 text-on-surface-variant sm:px-5" title={sale.address}>
                    {sale.address || '—'}
                  </td>
                  <td className="max-w-[260px] truncate px-3 py-3 text-on-surface-variant sm:px-5" title={sale.description}>
                    {sale.description || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">
                    {sale.paymentMethod || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 sm:px-5">
                    <StatusPill status={sale.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right sm:px-5">
                    <button
                      type="button"
                      onClick={() => openEditModal(sale)}
                      className="mr-2 rounded-full border border-outline-variant px-3 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-variant"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSale(sale.order_id)}
                      className="rounded-full border border-error/20 bg-error/5 px-3 py-1 text-xs font-semibold text-error hover:bg-error/10"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {visibleSales.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-xs text-on-surface-variant sm:px-5 sm:text-sm">
                    No {activeTab.toLowerCase()} transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 px-4 backdrop-blur-sm"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Edit Transaction {editingSale.order_id}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Update schedule, address, description, and status.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-variant"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-on-surface-variant">Customer</span>
                <input
                  type="text"
                  value={editingSale.customer}
                  onChange={(e) => handleEditChange('customer', e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-on-surface-variant">Material</span>
                <input
                  type="text"
                  value={editingSale.material}
                  onChange={(e) => handleEditChange('material', e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-on-surface-variant">Schedule Date</span>
                <input
                  type="date"
                  value={editingSale.scheduledDate || ''}
                  onChange={(e) => handleEditChange('scheduledDate', e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-on-surface-variant">Schedule Time</span>
                <input
                  type="time"
                  value={editingSale.scheduledTime || ''}
                  onChange={(e) => handleEditChange('scheduledTime', e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                <span className="font-semibold text-on-surface-variant">Address</span>
                <input
                  type="text"
                  value={editingSale.address || ''}
                  onChange={(e) => handleEditChange('address', e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                <span className="font-semibold text-on-surface-variant">Description</span>
                <textarea
                  rows={3}
                  value={editingSale.description || ''}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-on-surface-variant">Payment Method</span>
                <select
                  value={editingSale.paymentMethod || 'Cash'}
                  onChange={(e) => handleEditChange('paymentMethod', e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Gcash">Gcash</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}