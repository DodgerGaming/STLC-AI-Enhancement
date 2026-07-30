import { useEffect, useMemo, useState } from 'react'
import { Wallet, Layers, ShoppingCart, Eye, Download } from 'lucide-react'
import StatusPill from '../../components/StatusPill.jsx'
import SalesByTypeBarChart from '../../components/SalesByTypeBarChart.jsx'
import RevenueShareDonutChart from '../../components/RevenueShareDonutChart.jsx'
import LowStockDetailsModal from '../../components/LowStockDetailsModal.jsx'
import KpiCardAI from '../../components/ai/KpiCardAI.jsx'
import AIInsightPanel from '../../components/ai/AIInsightPanel.jsx'
import TopMovingItemsTable from '../../components/ai/TopMovingItemsTable.jsx'
import AveragePeakHourChart from '../../components/ai/AveragePeakHourChart.jsx'
import {
  recentSales,
  salesByTypeData,
  revenueShareData,
  dashboardKpis,
  materials,
  hideBatches,
  SCRAP_UNIT,
} from '../../data/mockLeather.js'
import { formatPeso, formatNumber } from '../../utils/format.js'

// NOTE: This page reads directly from src/data/mockLeather.js (already in
// this project) instead of calling the Django API. Once the backend is
// ready, swap the static imports below for real fetch() calls from
// data/apiLeather.js — the derivations and JSX don't need to change,
// since they already operate on the same shapes.

export default function DashboardAI() {
  const [activeTab, setActiveTab] = useState('Delivery')
  const [selectedDate, setSelectedDate] = useState('')
  const [isLowStockDetailsOpen, setIsLowStockDetailsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const PAGE_SIZE = 10

  // Brief simulated load so the skeleton/loading states are visible, same
  // as they will be once real network calls are wired in.
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const materialTypeMap = useMemo(() => {
    const map = {}
    materials.forEach((m) => {
      map[m.material_name] = m.leather_type
    })
    return map
  }, [])

  const salesWithDateKey = useMemo(
    () =>
      recentSales.map((sale) => {
        const parsed = new Date(sale.createdAt)
        return {
          ...sale,
          dateKey: Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10),
          hour: Number.isNaN(parsed.getTime()) ? null : parsed.getHours(),
        }
      }),
    [],
  )

  const filteredSales = useMemo(() => {
    if (!selectedDate) return salesWithDateKey
    return salesWithDateKey.filter((sale) => sale.dateKey === selectedDate)
  }, [salesWithDateKey, selectedDate])

  const visibleSales = useMemo(() => {
    const wantPickup = activeTab === 'Pick-up'
    return [...filteredSales]
      .filter((sale) => (wantPickup ? sale.fulfillment === 'Pickup' : sale.fulfillment === 'Delivery'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [filteredSales, activeTab])

  const pageCount = Math.max(1, Math.ceil(visibleSales.length / PAGE_SIZE))
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return visibleSales.slice(start, start + PAGE_SIZE)
  }, [visibleSales, currentPage])

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount)
  }, [currentPage, pageCount])

  // --- Top / slow moving items (by revenue, from recentSales) --------------
  const itemRevenueTotals = useMemo(() => {
    const totals = {}
    filteredSales.forEach((sale) => {
      totals[sale.material] = (totals[sale.material] || 0) + Number(sale.total || 0)
    })
    return Object.entries(totals).map(([name, value]) => ({ name, value }))
  }, [filteredSales])

  const fastMovingItems = useMemo(
    () => [...itemRevenueTotals].sort((a, b) => b.value - a.value).slice(0, 3),
    [itemRevenueTotals],
  )
  const slowMovingItems = useMemo(
    () => [...itemRevenueTotals].sort((a, b) => a.value - b.value).slice(0, 3),
    [itemRevenueTotals],
  )

  // --- Average peak hour (from recentSales.createdAt) -----------------------
  const formatHourLabel = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const normalized = hour % 12 === 0 ? 12 : hour % 12
    return `${normalized}${period}`
  }

  const peakHourData = useMemo(() => {
    const buckets = {}
    filteredSales.forEach((sale) => {
      if (sale.hour === null) return
      const label = formatHourLabel(sale.hour)
      if (!buckets[label]) buckets[label] = { hour: label, qty: 0, _sortHour: sale.hour }
      buckets[label].qty += 1
    })
    return Object.values(buckets)
      .sort((a, b) => a._sortHour - b._sortHour)
      .map(({ _sortHour, ...rest }) => rest)
  }, [filteredSales])

  // --- Low stock (from hideBatches) -----------------------------------------
  const lowStockBatches = useMemo(
    () =>
      hideBatches
        .filter((batch) => batch.status === 'Depleted')
        .map((batch) => ({
          batchCode: batch.batch_code,
          materialName: batch.material_name,
          leatherType: batch.leather_type,
          sizeSqft: batch.size_sqft,
          quantity: batch.quantity,
          status: batch.status,
        })),
    [],
  )

  const lowStockData = useMemo(() => {
    const grouped = {}
    lowStockBatches.forEach((batch) => {
      if (!grouped[batch.materialName]) grouped[batch.materialName] = { item: batch.materialName, totalSize: 0 }
      grouped[batch.materialName].totalSize += batch.sizeSqft * batch.quantity
    })
    return Object.values(grouped).sort((a, b) => b.totalSize - a.totalSize)
  }, [lowStockBatches])

  const openLowStockDetails = () => setIsLowStockDetailsOpen(true)
  const closeLowStockDetails = () => setIsLowStockDetailsOpen(false)

  // --- AI insight text (derived, not yet a real model call) -----------------
  const revenueByType = useMemo(() => {
    const totals = {}
    filteredSales.forEach((sale) => {
      const type = materialTypeMap[sale.material] || 'Cowhide'
      totals[type] = (totals[type] || 0) + Number(sale.total || 0)
    })
    return totals
  }, [filteredSales, materialTypeMap])

  const executiveSummaryInsight = useMemo(() => {
    if (isLoading) return null
    const entries = Object.entries(revenueByType)
    if (entries.length === 0) {
      return selectedDate ? `No sales recorded on ${selectedDate} yet.` : 'No sales data available yet.'
    }
    const [topType, topRevenue] = entries.sort((a, b) => b[1] - a[1])[0]
    return `${topType} is the top revenue driver${selectedDate ? ` on ${selectedDate}` : ' this period'}, contributing ${formatPeso(topRevenue)} of ${formatPeso(dashboardKpis.totalRevenue)} total revenue.`
  }, [revenueByType, isLoading, selectedDate])

  const stockInsight = useMemo(() => {
    if (isLoading) return null
    if (lowStockData.length === 0) {
      return 'All materials are currently within safe stock levels — no immediate restocking needed.'
    }
    const top = lowStockData[0]
    return `${lowStockData.length} material${lowStockData.length === 1 ? '' : 's'} need restocking, led by ${top.item} at ${formatNumber(top.totalSize, 1)} sqft needed.`
  }, [lowStockData, isLoading])

  const revenueKpiInsight = useMemo(() => {
    if (isLoading) return null
    const entries = Object.entries(revenueByType)
    if (entries.length === 0) return 'No revenue recorded yet'
    const [topType, topRevenue] = entries.sort((a, b) => b[1] - a[1])[0]
    return `${topType} leads at ${formatPeso(topRevenue)}`
  }, [revenueByType, isLoading])

  const leatherKpiInsight = useMemo(() => {
    if (isLoading) return null
    const top = [...salesByTypeData].sort((a, b) => b.qty - a.qty)[0]
    return top ? `${top.type} is the most-sold type` : 'No leather sold yet'
  }, [isLoading])

  const ordersKpiInsight = useMemo(() => {
    if (isLoading) return null
    const deliveryCount = filteredSales.filter((s) => s.fulfillment === 'Delivery').length
    const pickupCount = filteredSales.filter((s) => s.fulfillment === 'Pickup').length
    return filteredSales.length > 0 ? `${deliveryCount} delivery, ${pickupCount} pick-up` : 'No orders yet'
  }, [filteredSales, isLoading])

  const lowStockKpiInsight = useMemo(() => {
    if (isLoading) return null
    return lowStockData.length > 0 ? `${lowStockData[0].item} needs attention first` : 'Stock levels are healthy'
  }, [lowStockData, isLoading])

  const clearDateFilter = () => setSelectedDate('')

  const downloadCsv = (filename, rows, headers) => {
    const content = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\r\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportCsv = () => {
    const rows = salesByTypeData.map((entry) => ({
      Type: entry.type,
      Quantity: entry.qty,
      Unit: entry.unit,
    }))
    downloadCsv(`dashboard-ai-${selectedDate || 'all'}.csv`, rows, ['Type', 'Quantity', 'Unit'])
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Dashboard (AI Enhancement)</h1>
          <p className="text-sm text-on-surface-variant">Overview of sales, stock, and AI insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-on-surface-variant">Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <button
            type="button"
            onClick={clearDateFilter}
            className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-variant sm:px-4 sm:text-sm"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-surface transition-colors hover:bg-primary-dark sm:px-4 sm:text-sm"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <AIInsightPanel
        title="AI Executive Summary"
        insight={executiveSummaryInsight}
        loading={isLoading}
        variant="banner"
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCardAI
          label="Total Revenue"
          value={formatPeso(dashboardKpis.totalRevenue)}
          subtitle="All sales (demo data)"
          icon={Wallet}
          trend={{ direction: 'up', value: '+12.4%' }}
          aiInsight={revenueKpiInsight}
          aiInsightLoading={isLoading}
        />
        <KpiCardAI
          label="Leather Sold"
          value={`${formatNumber(dashboardKpis.leatherSoldSqft)} sqft + ${formatNumber(dashboardKpis.leatherSoldKg)} ${SCRAP_UNIT}`}
          subtitle="Across all materials"
          icon={Layers}
          aiInsight={leatherKpiInsight}
          aiInsightLoading={isLoading}
        />
        <KpiCardAI
          label="Total Orders"
          value={formatNumber(dashboardKpis.totalOrders)}
          subtitle="Completed orders (demo data)"
          icon={ShoppingCart}
          aiInsight={ordersKpiInsight}
          aiInsightLoading={isLoading}
        />
        <button type="button" onClick={openLowStockDetails} className="w-full text-left" aria-label="Open stock need details">
          <KpiCardAI
            label="Low Stock Items"
            value={formatNumber(dashboardKpis.lowStockItems)}
            subtitle="Need restocking"
            icon={Eye}
            tone={dashboardKpis.lowStockItems > 0 ? 'danger' : 'default'}
            aiInsight={lowStockKpiInsight}
            aiInsightLoading={isLoading}
          />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopMovingItemsTable fastItems={fastMovingItems} slowItems={slowMovingItems} loading={isLoading} />
        <AveragePeakHourChart data={peakHourData} loading={isLoading} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SalesByTypeBarChart data={salesByTypeData} />
        <RevenueShareDonutChart data={revenueShareData} loading={isLoading} />
      </div>

      <div className="mt-4">
        <AIInsightPanel title="AI Summary" insight={stockInsight} loading={isLoading} variant="compact" />
      </div>

      <LowStockDetailsModal open={isLowStockDetailsOpen} onClose={closeLowStockDetails} data={lowStockBatches} />

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-outline-variant px-4 py-4 sm:gap-4 sm:px-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Recent Transactions</h3>
            <p className="text-xs text-on-surface-variant">Toggle between delivery and pickup below.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['Delivery', 'Pick-up'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setActiveTab(option)
                  setCurrentPage(1)
                }}
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
          <table className="w-full min-w-[900px] table-auto text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-variant/60 font-semibold text-on-surface-variant">
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Order ID</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Customer</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Material</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Qty</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Total</th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale) => (
                <tr key={sale.order_id} className="border-b border-outline-variant last:border-0">
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-on-surface sm:px-5">{sale.order_id}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.customer}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.material}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.qty}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-on-surface sm:px-5">{formatPeso(sale.total)}</td>
                  <td className="whitespace-nowrap px-3 py-3 sm:px-5">
                    <StatusPill status={sale.status} />
                  </td>
                </tr>
              ))}
              {visibleSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-xs text-on-surface-variant sm:px-5 sm:text-sm">
                    No {activeTab.toLowerCase()} transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-on-surface-variant">
            Showing {visibleSales.length === 0 ? 0 : Math.min(visibleSales.length, (currentPage - 1) * PAGE_SIZE + 1)}
            {' - '}
            {Math.min(visibleSales.length, currentPage * PAGE_SIZE)} of {visibleSales.length} record{visibleSales.length === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-variant sm:px-4 sm:text-sm"
            >
              Prev
            </button>
            <span className="text-xs text-on-surface-variant">Page {currentPage} of {pageCount}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
              disabled={currentPage === pageCount}
              className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-variant sm:px-4 sm:text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
