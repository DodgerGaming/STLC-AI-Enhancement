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
  const visibleSales = recentSales.filter((sale) => sale.fulfillment === activeTab)

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
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-variant/60 font-semibold text-on-surface-variant">
                <th className="px-3 py-3 sm:px-5">Order ID</th>
                <th className="px-3 py-3 sm:px-5">Customer</th>
                <th className="hidden px-3 py-3 sm:table-cell sm:px-5">Material</th>
                <th className="px-3 py-3 sm:px-5">Qty</th>
                <th className="hidden px-3 py-3 md:table-cell md:px-5">Total</th>
                <th className="hidden px-3 py-3 lg:table-cell lg:px-5">Date</th>
                <th className="px-3 py-3 sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleSales.map((sale) => (
                <tr key={sale.order_id} className="border-b border-outline-variant last:border-0">
                  <td className="px-3 py-3 font-semibold text-on-surface sm:px-5">{sale.order_id}</td>
                  <td className="px-3 py-3 text-on-surface-variant sm:px-5">{sale.customer}</td>
                  <td className="hidden px-3 py-3 text-on-surface-variant sm:table-cell sm:px-5">{sale.material}</td>
                  <td className="px-3 py-3 text-on-surface-variant sm:px-5">{sale.qty}</td>
                  <td className="hidden px-3 py-3 font-semibold text-on-surface md:table-cell md:px-5">
                    {formatPeso(sale.total)}
                  </td>
                  <td className="hidden px-3 py-3 text-on-surface-variant lg:table-cell lg:px-5">{sale.date}</td>
                  <td className="px-3 py-3 sm:px-5">
                    <StatusPill status={sale.status} />
                  </td>
                </tr>
              ))}
              {visibleSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-xs text-on-surface-variant sm:px-5 sm:text-sm">
                    No {activeTab.toLowerCase()} transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
