import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Save } from 'lucide-react'
import StatusPill from '../components/StatusPill.jsx'
import { LEATHER_TYPES, unitForType } from '../data/mockLeather.js'
import { fetchBatches, updateBatch, deleteBatch } from '../data/apiLeather.js'
import { formatNumber } from '../utils/format.js'

const STATUS_OPTIONS = ['All', 'Available', 'Out of Stock']

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

const labelClass = 'text-sm font-semibold text-on-surface-variant'

// Maps a raw batch record from the backend into the row shape used in this page.
function mapBatchToRow(batch) {
  return {
    batch_code: batch.batch_code,
    material_name: batch.material_name,
    leather_type: batch.leather_type,
    tag: batch.tag || '',
    size_sqft: batch.size_sqft,
    quantity: batch.quantity,
    salePrice: batch.sale_price,
    unitPrice: batch.unit_price,
    source: batch.company,
    status: batch.status,
    added: new Date(batch.added_at).toLocaleString(),
    addedAt: new Date(batch.added_at).getTime(),
  }
}

export default function ManageLeatherHistory() {
  const navigate = useNavigate()
  const [historyItems, setHistoryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [editingItem, setEditingItem] = useState(null)
  const [editData, setEditData] = useState({})

  // Always pulls the latest batches straight from the backend — single source of truth,
  // shared by Leather Catalog, Manage Leather, and Full Leather History.
  const userRole = localStorage.getItem('userRole') || 'Clerk'
  const isAdmin = userRole === 'Admin'
  const isSupervisor = userRole === 'Supervisor'

  const refreshHistory = () => {
    setLoading(true)
    return fetchBatches({ limit: 100 })
      .then((data) => {
        if (!Array.isArray(data)) return
        const mapped = data.map(mapBatchToRow).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
        setHistoryItems(mapped)
        setError('')
      })
      .catch((err) => {
        setError(err.message || 'Failed to load inventory history')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshHistory()
  }, [])

  const visibleItems = historyItems.filter((item) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      item.batch_code.toLowerCase().includes(query) ||
      item.material_name.toLowerCase().includes(query) ||
      item.leather_type.toLowerCase().includes(query) ||
      item.source?.toLowerCase().includes(query)

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter
    const matchesType = typeFilter === 'All' || item.leather_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const openEditModal = (item) => {
    if (!isSupervisor) return
    setEditingItem(item)
    setEditData({ ...item })
  }

  const closeEditModal = () => {
    setEditingItem(null)
    setEditData({})
  }

  const saveEdit = () => {
    if (!editingItem) return

    const payload = {
      material_name: editData.material_name,
      leather_type: editData.leather_type,
      tag: editData.tag,
      description: editData.description,
      size_sqft: Number(editData.size_sqft) || 0,
      quantity: Number(editData.quantity) || 0,
      sale_price: Number(editData.salePrice) || 0,
      unit_price: Number(editData.unitPrice) || 0,
      company: editData.source,
      status: editData.status,
    }

    updateBatch(editingItem.batch_code, payload)
      .then(() => refreshHistory())
      .catch((err) => console.error('Failed to update batch', err))

    closeEditModal()
  }

  const deleteHistoryItem = (batchCode) => {
    if (!isAdmin) return
    const confirmed = window.confirm(
      `Delete batch ${batchCode}? This cannot be undone. Proceed only if you are sure.`
    )
    if (!confirmed) return

    deleteBatch(batchCode)
      .catch((err) => console.error('Failed to delete batch', err))
      .finally(() => refreshHistory())
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/manage-leather')}
            className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-on-surface transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-sm text-on-surface-variant">
              Inventory batches with search, status filter, and edit / delete actions.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl border border-outline-variant bg-surface p-5 shadow-card sm:grid-cols-[1.6fr_1fr]">
        <div>
          <label className={labelClass}>Search</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batch code, material, type, or supplier"
            className={`mt-2 ${inputClass}`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`mt-2 ${inputClass}`}
            >
              {STATUS_OPTIONS.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Leather Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`mt-2 ${inputClass}`}
            >
              {['All', ...LEATHER_TYPES].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Inventory History</h3>
            <p className="text-xs text-on-surface-variant">
              {historyItems.length === 0
                ? 'No inventory batches found in the database.'
                : 'Showing the latest inventory batches in history.'}
            </p>
          </div>
          <div className="text-xs text-on-surface-variant">
            {visibleItems.length} result{visibleItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-variant/60 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                <th className="px-5 py-3">Batch ID</th>
                <th className="px-5 py-3">Material</th>
                <th className="px-5 py-3">Leather Type</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Added</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-on-surface-variant">
                    Loading inventory history...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-on-surface-variant">
                    No matching inventory batches found.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item, index) => (
                  <tr key={`${item.batch_code}-${index}`} className="border-b border-outline-variant last:border-0">
                    <td className="px-5 py-3 font-semibold text-on-surface">{item.batch_code}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{item.material_name}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{item.leather_type}</td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {formatNumber(item.size_sqft, 2)} {unitForType(item.leather_type)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">{item.added}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-lg border border-outline-variant bg-surface px-3 py-1 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHistoryItem(item.batch_code)}
                          className="rounded-lg border border-outline-variant bg-surface px-3 py-1 text-xs font-semibold text-on-surface hover:border-danger hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Edit Batch {editingItem.batch_code}</h2>
                <p className="text-sm text-on-surface-variant">Update the batch details and save changes.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-on-surface-variant hover:border-primary hover:text-primary"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-on-surface-variant">Batch Code</label>
                <input
                  type="text"
                  value={editingItem.batch_code}
                  disabled
                  className="mt-2 w-full cursor-not-allowed rounded-xl border border-outline-variant bg-surface/90 px-3 py-2 text-sm text-on-surface-variant"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface-variant">Material Name</label>
                <input
                  type="text"
                  value={editData.material_name}
                  onChange={(e) => setEditData((prev) => ({ ...prev, material_name: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant">Leather Type</label>
                <select
                  value={editData.leather_type}
                  onChange={(e) => setEditData((prev) => ({ ...prev, leather_type: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {LEATHER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface-variant">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editData.quantity}
                  onChange={(e) => setEditData((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant">Sale Price</label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.salePrice}
                    onChange={(e) => setEditData((prev) => ({ ...prev, salePrice: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface px-10 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface-variant">Size ({unitForType(editData.leather_type)})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editData.size_sqft}
                  onChange={(e) => setEditData((prev) => ({ ...prev, size_sqft: Number(e.target.value) }))}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant">Unit Price</label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.unitPrice}
                    onChange={(e) => setEditData((prev) => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface px-10 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-on-surface-variant">Source / Company</label>
                <input
                  type="text"
                  value={editData.source}
                  onChange={(e) => setEditData((prev) => ({ ...prev, source: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface-variant">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData((prev) => ({ ...prev, status: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {STATUS_OPTIONS.filter((option) => option !== 'All').map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}