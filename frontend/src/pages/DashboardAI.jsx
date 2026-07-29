import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import KpiCard from '../components/KpiCard.jsx'
import { AlertTriangle, Download, Wallet, Layers, ShoppingCart, Eye } from 'lucide-react'
import StatusPill from '../components/StatusPill.jsx'
import SalesByTypeBarChart from '../components/SalesByTypeBarChart.jsx'
import RevenueShareDonutChart from '../components/RevenueShareDonutChart.jsx'
import LowStockDetailsModal from '../components/LowStockDetailsModal.jsx'
import AIInsightPanel from '../components/AIInsightPanel.jsx'
import TopMovingItemsTable from '../components/TopMovingItemsTable.jsx'
import AveragePeakHourChart from '../components/AveragePeakHourChart.jsx'
import { SCRAP_UNIT } from '../data/mockLeather.js'
import { fetchBatches, fetchMaterials, fetchOrders, deleteOrder } from '../data/apiLeather.js'
import { formatPeso, formatNumber } from '../utils/format.js'

const LEATHER_TYPE_COLORS = {
  Cowhide: '#8B2525',
  'Goat Skin': '#C76B6B',
  'Scrap Leather': '#E8B4B4',
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Delivery')
  const [sales, setSales] = useState([])
  const [materials, setMaterials] = useState([])
  const [batches, setBatches] = useState([])
  const [editingSale, setEditingSale] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [isLowStockDetailsOpen, setIsLowStockDetailsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isOrdersLoading, setIsOrdersLoading] = useState(true)
  const PAGE_SIZE = 10
  const userRole = localStorage.getItem('userRole') || 'Clerk'
  const isSupervisor = userRole === 'Supervisor'
  const isAdmin = userRole === 'Admin'

  const loadOrders = useCallback(async () => {
    try {
      setIsOrdersLoading(true)
      const data = await fetchOrders()
      if (!Array.isArray(data)) return
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
        fulfillment: normalizeFulfillment(o.fulfillment) === 'pickup' ? 'Pick-up' : normalizeFulfillment(o.fulfillment) === 'delivery' ? 'Delivery' : (o.fulfillment || 'Delivery'),
        scheduledDate: o.scheduled_date,
        scheduledTime: o.scheduled_time,
        createdAt: o.created_at,
        createdDate: o.created_at ? o.created_at.slice(0, 10) : '',
        raw: o,
      }))
      setSales(mapped)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setIsOrdersLoading(false)
    }
  }, [])

  const normalizeFulfillment = (value) => {
    const v = (value || '').toLowerCase().trim()
    if (v.includes('pick')) return 'pickup'
    if (v.includes('deliv')) return 'delivery'
    return v
  }

  const formatDateKey = (value) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 10)
  }

  const classifyLeatherType = (materialName = '') => {
    const lower = materialName.toLowerCase()
    if (lower.includes('goat')) return 'Goat Skin'
    if (lower.includes('scrap')) return 'Scrap Leather'
    return 'Cowhide'
  }

  const filterBuyFulfillment = (sale) => {
    const normalized = normalizeFulfillment(sale.fulfillment)
    const tabNormalized = normalizeFulfillment(activeTab)
    return normalized === tabNormalized
  }

  const filteredSales = useMemo(() => {
    const dateKey = selectedDate || ''
    return sales.filter((sale) => {
      if (!dateKey) return true
      return sale.createdDate === dateKey
    })
  }, [sales, selectedDate])

  const salesByTypeData = useMemo(() => {
    const totals = {}
    filteredSales.forEach((sale) => {
      ;(sale.raw?.items || []).forEach((item) => {
        const type = classifyLeatherType(item.material_name)
        const qty = Number(item.size_sqft ?? item.qty ?? 0) || 0
        const revenue = Number(item.unit_price ?? 0) * Number(item.qty ?? 0)
        const unit = type === 'Scrap Leather' ? SCRAP_UNIT : 'sqft'

        if (!totals[type]) {
          totals[type] = { type, qty: 0, unit, revenue: 0 }
        }

        totals[type].qty += qty
        totals[type].revenue += revenue
      })
    })

    return Object.values(totals).map((entry) => ({
      ...entry,
      qty: Math.round(entry.qty * 100) / 100,
      revenue: Math.round(entry.revenue * 100) / 100,
    }))
  }, [filteredSales])

  const dashboardKpis = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => {
        acc.totalRevenue += Number(sale.total) || 0
        acc.totalOrders += 1
        ;(sale.raw?.items || []).forEach((item) => {
          const type = classifyLeatherType(item.material_name)
          const qty = Number(item.size_sqft ?? item.qty ?? 0) || 0
          if (type === 'Scrap Leather') {
            acc.leatherSoldKg += qty
          } else {
            acc.leatherSoldSqft += qty
          }
        })
        return acc
      },
      { totalRevenue: 0, leatherSoldSqft: 0, leatherSoldKg: 0, totalOrders: 0 },
    )
  }, [filteredSales])

  const isUnavailableBatchStatus = (status) => {
    const normalized = (status || '').toLowerCase().trim()
    return normalized === 'out of stock' || normalized === 'depleted'
  }

  const lowStockData = useMemo(() => {
    const grouped = batches.reduce((acc, batch) => {
      if (!isUnavailableBatchStatus(batch.status)) return acc

      const itemLabel = batch.material_name || batch.material_id || 'Unknown'
      if (!acc[itemLabel]) acc[itemLabel] = { item: itemLabel, count: 0, totalSize: 0 }
      acc[itemLabel].count += 1
      acc[itemLabel].totalSize += Number(batch.size_sqft || 0) * Number(batch.quantity || 0)
      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => b.totalSize - a.totalSize)
  }, [batches])

  const lowStockBatches = useMemo(
    () => batches
      .filter((batch) => isUnavailableBatchStatus(batch.status))
      .map((batch) => ({
        batchCode: batch.batch_code,
        materialName: batch.material_name || batch.material_id || 'Unknown',
        leatherType: batch.leather_type || 'Unknown',
        sizeSqft: Number(batch.size_sqft || 0),
        quantity: Number(batch.quantity || 0),
        status: batch.status || 'Unknown',
      })),
    [batches],
  )

  const lowStockItems = useMemo(
    () => lowStockData.length,
    [lowStockData],
  )

  const openLowStockDetails = () => setIsLowStockDetailsOpen(true)
  const closeLowStockDetails = () => setIsLowStockDetailsOpen(false)

  const revenueShareData = useMemo(() => {
    const totalRevenue = dashboardKpis.totalRevenue || 1
    return salesByTypeData.map((entry) => ({
      type: entry.type,
      value: Math.round((entry.revenue / totalRevenue) * 100),
      color: LEATHER_TYPE_COLORS[entry.type] ?? '#C76B6B',
    }))
  }, [salesByTypeData, dashboardKpis.totalRevenue])

  // --- AI-enhanced dashboard additions -------------------------------------

  const formatHourLabel = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const normalized = hour % 12 === 0 ? 12 : hour % 12
    return `${normalized}${period}`
  }

  const itemRevenueTotals = useMemo(() => {
    const totals = {}
    filteredSales.forEach((sale) => {
      ;(sale.raw?.items || []).forEach((item) => {
        const name = item.material_name || 'Unknown'
        const revenue = Number(item.unit_price ?? 0) * Number(item.qty ?? 0)
        totals[name] = (totals[name] || 0) + revenue
      })
    })
    return Object.entries(totals).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }))
  }, [filteredSales])

  const fastMovingItems = useMemo(
    () => [...itemRevenueTotals].sort((a, b) => b.value - a.value).slice(0, 3),
    [itemRevenueTotals],
  )

  const slowMovingItems = useMemo(
    () => [...itemRevenueTotals].sort((a, b) => a.value - b.value).slice(0, 3),
    [itemRevenueTotals],
  )

  const peakHourData = useMemo(() => {
    const buckets = {}
    filteredSales.forEach((sale) => {
      if (!sale.createdAt) return
      const date = new Date(sale.createdAt)
      if (Number.isNaN(date.getTime())) return
      const hour = date.getHours()
      const label = formatHourLabel(hour)
      if (!buckets[label]) buckets[label] = { hour: label, qty: 0, _sortHour: hour }
      buckets[label].qty += 1
    })
    return Object.values(buckets)
      .sort((a, b) => a._sortHour - b._sortHour)
      .map(({ _sortHour, ...rest }) => rest)
  }, [filteredSales])

  // NOTE: These insight strings are generated client-side from the same data
  // already on this page. Once the Analytics Engine / AI backend is ready,
  // swap these two useMemo blocks for the API response (insight text + trend)
  // — the AIInsightPanel props (`insight`, `trend`, `loading`) already match
  // that shape, so no markup changes will be needed downstream.
  const executiveSummaryInsight = useMemo(() => {
    if (isOrdersLoading) return null
    if (salesByTypeData.length === 0) {
      return selectedDate
        ? `No sales recorded on ${selectedDate} yet.`
        : 'No sales data available yet for this period.'
    }
    const topType = [...salesByTypeData].sort((a, b) => b.revenue - a.revenue)[0]
    return `${topType.type} is the top revenue driver${selectedDate ? ` on ${selectedDate}` : ' this period'}, contributing ${formatPeso(topType.revenue)} of ${formatPeso(dashboardKpis.totalRevenue)} total revenue across ${formatNumber(dashboardKpis.totalOrders)} orders.`
  }, [salesByTypeData, dashboardKpis, isOrdersLoading, selectedDate])

  const stockInsight = useMemo(() => {
    if (isOrdersLoading) return null
    if (lowStockItems === 0) {
      return 'All materials are currently within safe stock levels — no immediate restocking needed.'
    }
    const topLowStock = lowStockData[0]
    return `${lowStockItems} material${lowStockItems === 1 ? '' : 's'} need restocking, led by ${topLowStock?.item} at ${formatNumber(topLowStock?.totalSize)} sqft needed.`
  }, [lowStockItems, lowStockData, isOrdersLoading])

  // Per-KPI compact insights — matches the wireframe's "KPI# + AI insight" boxes.
  const revenueKpiInsight = useMemo(() => {
    if (isOrdersLoading) return null
    if (salesByTypeData.length === 0) return 'No revenue recorded for this period yet.'
    const topType = [...salesByTypeData].sort((a, b) => b.revenue - a.revenue)[0]
    const share = dashboardKpis.totalRevenue
      ? Math.round((topType.revenue / dashboardKpis.totalRevenue) * 100)
      : 0
    return `${topType.type} drives ${share}% of total revenue this period.`
  }, [salesByTypeData, dashboardKpis.totalRevenue, isOrdersLoading])

  const leatherKpiInsight = useMemo(() => {
    if (isOrdersLoading) return null
    if (salesByTypeData.length === 0) return 'No leather movement recorded yet.'
    const topByQty = [...salesByTypeData].sort((a, b) => b.qty - a.qty)[0]
    return `${topByQty.type} is the most-used material at ${formatNumber(topByQty.qty)} ${topByQty.unit}.`
  }, [salesByTypeData, isOrdersLoading])

  const ordersKpiInsight = useMemo(() => {
    if (isOrdersLoading) return null
    if (filteredSales.length === 0) return 'No orders recorded for this period yet.'
    const deliveryCount = filteredSales.filter(
      (sale) => normalizeFulfillment(sale.fulfillment) === 'delivery',
    ).length
    const pickupCount = filteredSales.length - deliveryCount
    return `${deliveryCount} delivery vs ${pickupCount} pick-up order${pickupCount === 1 ? '' : 's'} this period.`
  }, [filteredSales, isOrdersLoading])

  const lowStockKpiInsight = useMemo(() => {
    if (isOrdersLoading) return null
    if (lowStockItems === 0) return 'No materials currently need restocking.'
    const topLowStock = lowStockData[0]
    return `${topLowStock?.item} needs attention first — ${formatNumber(topLowStock?.totalSize)} sqft short.`
  }, [lowStockItems, lowStockData, isOrdersLoading])

  // --------------------------------------------------------------------------

  const visibleSales = useMemo(() => {
    const filtered = filteredSales.filter(filterBuyFulfillment)
    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime() || 0
      const bTime = new Date(b.createdAt).getTime() || 0
      return bTime - aTime
    })
  }, [filteredSales, activeTab])
  const pageCount = Math.max(1, Math.ceil(visibleSales.length / PAGE_SIZE))
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return visibleSales.slice(start, start + PAGE_SIZE)
  }, [visibleSales, currentPage])

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  const downloadCsv = (filename, rows, headers) => {
    const content = [headers.join(','), ...rows.map((row) => headers.map((header) => {
      const value = row[header]
      const escaped = String(value ?? '').replace(/"/g, '""')
      return `"${escaped}"`
    }).join(','))].join('\r\n')

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

  const handleExportDashboardCsv = useCallback(() => {
    const summaryRows = [
      {
        Type: 'Total Revenue',
        Quantity: formatPeso(dashboardKpis.totalRevenue),
        Unit: selectedDate ? `Sales on ${selectedDate}` : 'All sales',
        Revenue: '',
      },
      {
        Type: 'Leather Sold',
        Quantity: `${formatNumber(dashboardKpis.leatherSoldSqft)} sqft + ${formatNumber(dashboardKpis.leatherSoldKg)} ${SCRAP_UNIT}`,
        Unit: selectedDate ? `Filtered by ${selectedDate}` : 'Across all materials',
        Revenue: '',
      },
      {
        Type: 'Total Orders',
        Quantity: dashboardKpis.totalOrders,
        Unit: selectedDate ? `Orders on ${selectedDate}` : 'All orders',
        Revenue: '',
      },
      {
        Type: 'Low Stock Items',
        Quantity: lowStockItems,
        Unit: 'Need restocking',
        Revenue: '',
      },
      { Type: '', Quantity: '', Unit: '', Revenue: '' },
    ]

    const rows = [
      ...summaryRows,
      ...salesByTypeData.map((entry) => ({
        Type: entry.type,
        Quantity: entry.qty,
        Unit: entry.unit,
        Revenue: entry.revenue,
      })),
      { Type: '', Quantity: '', Unit: '', Revenue: '' },
      { Type: 'Low Stock Graph', Quantity: 'Material', Unit: 'Out-of-stock batches', Revenue: 'Total sqft needed' },
      ...lowStockData.map((entry) => ({
        Type: entry.item,
        Quantity: entry.count,
        Unit: 'batches',
        Revenue: `${formatNumber(entry.totalSize)} sqft`,
      })),
    ]

    downloadCsv(`dashboard-sales-${selectedDate || 'all'}.csv`, rows, ['Type', 'Quantity', 'Unit', 'Revenue'])
  }, [dashboardKpis, lowStockItems, lowStockData, salesByTypeData, selectedDate])

  const handleExportTransactionsCsv = useCallback(() => {
    const rows = filteredSales.map((sale) => ({
      'Order ID': sale.order_id,
      Customer: sale.customer,
      Material: sale.material,
      Qty: sale.qty,
      Total: sale.total,
      Fulfillment: sale.fulfillment,
      Address: sale.address,
      Description: sale.description,
      Payment: sale.paymentMethod,
      Status: sale.status,
      'Created At': sale.createdAt,
      'Scheduled Date': sale.scheduledDate,
      'Scheduled Time': sale.scheduledTime,
    }))
    downloadCsv(`transactions-${selectedDate || 'all'}.csv`, rows, [
      'Order ID',
      'Customer',
      'Material',
      'Qty',
      'Total',
      'Fulfillment',
      'Address',
      'Description',
      'Payment',
      'Status',
      'Created At',
      'Scheduled Date',
      'Scheduled Time',
    ])
  }, [filteredSales, selectedDate])

  const clearDateFilter = () => setSelectedDate('')

  const { setPageHeaderActions } = useOutletContext()

  useEffect(() => {
    if (!setPageHeaderActions) return

    setPageHeaderActions(
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <label className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-semibold text-on-surface-variant">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(formatDateKey(e.target.value) || '')}
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
          onClick={handleExportDashboardCsv}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-surface transition-colors hover:bg-primary-dark sm:px-4 sm:text-sm"
        >
          <Download size={14} />
          Export Dashboard CSV
        </button>
      </div>,
    )

    return () => setPageHeaderActions(null)
  }, [selectedDate, setPageHeaderActions, clearDateFilter, handleExportDashboardCsv])

  // Load orders from backend on mount
  useEffect(() => {
    let active = true

    if (active) {
      loadOrders()
    }

    fetchMaterials()
      .then((data) => {
        if (!active || !Array.isArray(data)) return
        setMaterials(data)
      })
      .catch(() => {})

    fetchBatches({ limit: 200 })
      .then((data) => {
        if (!active || !Array.isArray(data)) return
        setBatches(data)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [loadOrders])

  const openEditModal = (sale) => setEditingSale({ ...sale })
  const closeEditModal = () => setEditingSale(null)

  const handleSaveEdit = () => {
    if (!editingSale) return
    setSales((prev) => prev.map((sale) => (sale.order_id === editingSale.order_id ? editingSale : sale)))
    closeEditModal()
  }

  const deleteSale = async (orderId) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete order ${orderId}? This action cannot be undone.`,
    )
    if (!confirmed) return

    try {
      await deleteOrder(orderId)
      await loadOrders()
      setCurrentPage(1)
      if (editingSale?.order_id === orderId) closeEditModal()
    } catch (error) {
      console.error('Failed to delete order:', error)
      // Optional: show user-visible error handling here
    }
  }

  const handleEditChange = (field, value) => {
    setEditingSale((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  return (
    <div>
      <AIInsightPanel
        title="AI Executive Summary"
        insight={executiveSummaryInsight}
        loading={isOrdersLoading}
        variant="banner"
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatPeso(dashboardKpis.totalRevenue)}
          subtitle={selectedDate ? `Sales on ${selectedDate}` : 'All sales'}
          icon={Wallet}
          trend={{ direction: 'up', value: '+12.4%' }}
          aiInsight={revenueKpiInsight}
          aiInsightLoading={isOrdersLoading}
        />
        <KpiCard
          label="Leather Sold"
          value={`${formatNumber(dashboardKpis.leatherSoldSqft)} sqft + ${formatNumber(
            dashboardKpis.leatherSoldKg,
          )} ${SCRAP_UNIT}`}
          subtitle={selectedDate ? `Filtered by ${selectedDate}` : 'Across all materials'}
          icon={Layers}
          aiInsight={leatherKpiInsight}
          aiInsightLoading={isOrdersLoading}
        />
        <KpiCard
          label="Total Orders"
          value={formatNumber(dashboardKpis.totalOrders)}
          subtitle={selectedDate ? `Orders on ${selectedDate}` : 'All orders'}
          icon={ShoppingCart}
          aiInsight={ordersKpiInsight}
          aiInsightLoading={isOrdersLoading}
        />
        <button
          type="button"
          onClick={openLowStockDetails}
          className="w-full text-left"
          aria-label="Open stock need details"
        >
          <KpiCard
            label="Low Stock Items"
            value={formatNumber(lowStockItems)}
            subtitle="Need restocking"
            icon={Eye}
            tone={lowStockItems > 0 ? 'danger' : 'default'}
            aiInsight={lowStockKpiInsight}
            aiInsightLoading={isOrdersLoading}
          />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopMovingItemsTable
          fastItems={fastMovingItems}
          slowItems={slowMovingItems}
          loading={isOrdersLoading}
        />
        <AveragePeakHourChart data={peakHourData} loading={isOrdersLoading} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SalesByTypeBarChart data={salesByTypeData} />
        <RevenueShareDonutChart data={revenueShareData} loading={isOrdersLoading} />
      </div>

      <div className="mt-4">
        <AIInsightPanel
          title="AI Summary"
          insight={stockInsight}
          loading={isOrdersLoading}
          variant="compact"
        />
      </div>

      <LowStockDetailsModal
        open={isLowStockDetailsOpen}
        onClose={closeLowStockDetails}
        data={lowStockBatches}
      />

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
            <button
              type="button"
              onClick={handleExportTransactionsCsv}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#8B2525] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#6f1b1b] sm:px-4 sm:text-sm"
            >
              <Download size={14} />
              Export Transactions CSV
            </button>
          </div>
        </div>

        {/* Horizontal scroll wrapper: table keeps a min-width so columns keep their
            natural size (no squeezed/cut-off text). User scrolls sideways instead. */}
        <div className="overflow-x-auto">
          {(() => {
            const isPickup = normalizeFulfillment(activeTab) === 'pickup'
            const tableColSpan = isPickup ? 10 : 12
            return (
          <table className="w-full min-w-[1280px] table-auto text-left text-xs sm:text-sm">
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
                <th className="whitespace-nowrap px-3 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale) => (
                <tr key={sale.order_id} className="border-b border-outline-variant last:border-0">
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-on-surface sm:px-5">{sale.order_id}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.customer}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.material}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.qty}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-on-surface sm:px-5">
                    {formatPeso(sale.total)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">{sale.fulfillment || '—'}</td>
                  {normalizeFulfillment(activeTab) === 'delivery' && (
                    <>
                      <td className="max-w-[220px] truncate px-3 py-3 text-on-surface-variant sm:px-5" title={sale.address}>
                        {sale.address || '—'}
                      </td>
                      <td className="max-w-[260px] truncate px-3 py-3 text-on-surface-variant sm:px-5" title={sale.description}>
                        {sale.description || '—'}
                      </td>
                    </>
                  )}
                  <td className="whitespace-nowrap px-3 py-3 text-on-surface-variant sm:px-5">
                    {sale.paymentMethod || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 sm:px-5">
                    <StatusPill status={sale.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right sm:px-5">
                    {isSupervisor && (
                      <button
                        type="button"
                        onClick={() => openEditModal(sale)}
                        className="mr-2 rounded-full border border-outline-variant px-3 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-variant"
                      >
                        Edit
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteSale(sale.order_id)}
                        className="rounded-full border border-error/20 bg-error/5 px-3 py-1 text-xs font-semibold text-error hover:bg-error/10"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {visibleSales.length === 0 && (
                <tr>
                  <td colSpan={(() => {
                    const isPickup = normalizeFulfillment(activeTab) === 'pickup'
                    return isPickup ? 10 : 12
                  })()} className="px-3 py-8 text-center text-xs text-on-surface-variant sm:px-5 sm:text-sm">
                    No {activeTab.toLowerCase()} transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
            )
          })()}
        </div>
        <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-on-surface-variant">
            Showing {visibleSales.length === 0 ? 0 : Math.min(visibleSales.length, (currentPage - 1) * PAGE_SIZE + 1)}
            {' - '}
            {Math.min(visibleSales.length, currentPage * PAGE_SIZE)} of {visibleSales.length} {activeTab.toLowerCase()} record{visibleSales.length === 1 ? '' : 's'}
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
                {normalizeFulfillment(editingSale.fulfillment) === 'delivery' && (
                  <>
                    <span className="font-semibold text-on-surface-variant">Address</span>
                    <input
                      type="text"
                      value={editingSale.address || ''}
                      onChange={(e) => handleEditChange('address', e.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </>
                )}
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
                  value={editingSale.paymentMethod || 'Over the Counter'}
                  onChange={(e) => handleEditChange('paymentMethod', e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Over the Counter">Over the Counter</option>
                  <option value="Online Payment">Online Payment</option>
                  {normalizeFulfillment(editingSale.fulfillment) === 'delivery' && (
                    <option value="COD">COD</option>
                  )}
                  {/* Preserve any existing payment method value that's not in the list */}
                  {editingSale.paymentMethod && !['Over the Counter', 'Online Payment', 'COD'].includes(editingSale.paymentMethod) && (
                    <option value={editingSale.paymentMethod}>{editingSale.paymentMethod}</option>
                  )}
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
              {isSupervisor ? (
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
                >
                  Save Changes
                </button>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  Only Supervisors can update transactions.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}