import { useEffect, useRef, useState } from 'react'
import { Plus, ImagePlus, Save, BadgeCheck, ChevronRight, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatusPill from '../components/StatusPill.jsx'
import { LEATHER_TYPES, unitForType } from '../data/mockLeather.js'
import { createBatch, fetchBatches, updateBatch, deleteBatch } from '../data/apiLeather.js'
import { formatPeso, formatNumber } from '../utils/format.js'

const STATUS_OPTIONS = ['Available']

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

const labelClass = 'text-sm font-semibold text-on-surface-variant'

const TAG_OPTIONS = ['None', 'Best Seller', 'New Arrival', 'Low Stock', 'Sale']

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

export default function ManageLeather() {
  const fileInputRef = useRef(null)

  const [batchCode, setBatchCode] = useState('')
  const [materialName, setMaterialName] = useState('')
  const [leatherType, setLeatherType] = useState(LEATHER_TYPES[0])
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [status, setStatus] = useState('Available')
  const [tag, setTag] = useState('')

  const [sizeSqft, setSizeSqft] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [source, setSource] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const navigate = useNavigate()
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)
  const [recentError, setRecentError] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [errors, setErrors] = useState({})
  const [editingEntry, setEditingEntry] = useState(null)
  const [editData, setEditData] = useState({})

  const unit = unitForType(leatherType)
  const editUnit = unitForType(editData.leather_type || editingEntry?.leather_type || LEATHER_TYPES[0])

  const estValuation = (Number(sizeSqft) || 0) * (Number(unitPrice) || 0)
  const margin =
    Number(salePrice) > 0 ? ((Number(salePrice) - Number(unitPrice)) / Number(salePrice)) * 100 : 0

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    if (errors.image) setErrors((prev) => ({ ...prev, image: '' }))
  }

  const getValidationErrors = () => {
    const newErrors = {}

    if (!batchCode.trim()) newErrors.batchCode = 'Batch Code is required'
    if (!materialName.trim()) newErrors.materialName = 'Material Name is required'
    if (!quantity || Number(quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0'
    if (!salePrice || Number(salePrice) <= 0) newErrors.salePrice = 'Sale Price must be greater than 0'
    if (!unitPrice || Number(unitPrice) <= 0) newErrors.unitPrice = 'Unit Price must be greater than 0'
    if (!source.trim()) newErrors.source = 'Source/Company is required'
    if (!previewUrl) newErrors.image = 'Image is required'
    if (sizeSqft && Number(sizeSqft) <= 0) newErrors.sizeSqft = 'Size must be greater than 0'

    return newErrors
  }

  // Always pulls the latest batches straight from the backend — single source of truth,
  // shared by Leather Catalog, Manage Leather, and Full Leather History.
  const refreshRecentlyAdded = () => {
    setRecentLoading(true)
    return fetchBatches({ limit: 100 })
      .then((data) => {
        if (!Array.isArray(data)) return
        const mapped = data.map(mapBatchToRow).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
        setRecentlyAdded(mapped.slice(0, 5))
        setRecentError('')
      })
      .catch((err) => {
        setRecentError(err.message || 'Failed to load recent batches')
      })
      .finally(() => setRecentLoading(false))
  }

  const openEditModal = (item) => {
    setEditingEntry(item)
    setEditData({
      material_name: item.material_name,
      leather_type: item.leather_type,
      tag: item.tag || '',
      description: item.description || '',
      size_sqft: item.size_sqft,
      quantity: item.quantity,
      salePrice: item.salePrice,
      unitPrice: item.unitPrice,
      source: item.source,
      status: item.status,
    })
  }

  const closeEditModal = () => {
    setEditingEntry(null)
    setEditData({})
  }

  const saveEdit = () => {
    if (!editingEntry) return

    const payload = {
      material_name: editData.material_name,
      leather_type: editData.leather_type,
      tag: editData.tag,
      size_sqft: Number(editData.size_sqft) || 0,
      quantity: Number(editData.quantity) || 0,
      sale_price: Number(editData.salePrice) || 0,
      unit_price: Number(editData.unitPrice) || 0,
      company: editData.source,
      status: editData.status,
    }

    updateBatch(editingEntry.batch_code, payload)
      .then(() => refreshRecentlyAdded())
      .catch((err) => console.error('Failed to update batch', err))

    closeEditModal()
  }

  const deleteEntry = (batchCode) => {
    // Optimistically remove from UI
    setRecentlyAdded((prev) => prev.filter((item) => item.batch_code !== batchCode))
    deleteBatch(batchCode)
      .then(() => {
        // Refresh to ensure sync with backend
        refreshRecentlyAdded()
      })
      .catch((err) => {
        console.error('Failed to delete batch', err)
        // Refresh on error too to restore the list
        refreshRecentlyAdded()
      })
  }

  const resetForm = () => {
    setBatchCode('')
    setMaterialName('')
    setLeatherType(LEATHER_TYPES[0])
    setDescription('')
    setQuantity('')
    setSalePrice('')
    setStatus('Available')
    setTag('')
    setSizeSqft('')
    setUnitPrice('')
    setSource('')
    setPreviewUrl(null)
  }

  // Load recent batches from backend on mount
  useEffect(() => {
    refreshRecentlyAdded()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = getValidationErrors()
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})

    const payload = {
      batch_code: batchCode.trim(),
      material_name: materialName.trim(),
      leather_type: leatherType,
      sku: batchCode.trim(),
      tag: tag.trim(),
      quantity: Number(quantity) || 0,
      size_sqft: Number(sizeSqft) || 0,
      unit_price: Number(unitPrice) || 0,
      sale_price: Number(salePrice) || 0,
      company: source.trim(),
      status,
      description: description.trim(),
      unit: unitForType(leatherType),
    }

    createBatch(payload)
      .then(() => refreshRecentlyAdded())
      .catch((err) => console.error('Failed to create batch', err))

    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
    resetForm()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-surface">
            <Plus size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Add New Leather Batch</h1>
            <p className="mt-0.5 text-sm text-on-surface-variant">Register incoming stock into the central inventory system.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-[1.6fr_1fr]">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
            <div>
              <label className={labelClass}>Batch Code</label>
              <input
                type="text"
                value={batchCode}
                onChange={(e) => {
                  setBatchCode(e.target.value)
                  if (errors.batchCode) setErrors((prev) => ({ ...prev, batchCode: '' }))
                }}
                placeholder="e.g. LW-2024-089"
                className={`mt-1.5 ${inputClass} ${errors.batchCode ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                required
              />
              {errors.batchCode && <p className="mt-1 text-xs text-red-500">{errors.batchCode}</p>}
            </div>

            <div>
              <label className={labelClass}>Material Name</label>
              <input
                type="text"
                value={materialName}
                onChange={(e) => {
                  setMaterialName(e.target.value)
                  if (errors.materialName) setErrors((prev) => ({ ...prev, materialName: '' }))
                }}
                placeholder="e.g. Tuscan Pebbled Brown"
                className={`mt-1.5 ${inputClass} ${errors.materialName ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                required
              />
              {errors.materialName && <p className="mt-1 text-xs text-red-500">{errors.materialName}</p>}
            </div>

            <div>
              <label className={labelClass}>Leather Type</label>
              <select
                value={leatherType}
                onChange={(e) => setLeatherType(e.target.value)}
                className={`mt-1.5 ${inputClass}`}
              >
                {LEATHER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Tag</label>
              <select
                value={tag || 'None'}
                onChange={(e) => setTag(e.target.value === 'None' ? '' : e.target.value)}
                className={`mt-1.5 ${inputClass}`}
              >
                {TAG_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Premium Italian leather with natural grain finish"
                className={`mt-1.5 min-h-24 resize-none ${inputClass}`}
              />
            </div>

            <div>
              <label className={labelClass}>Quantity</label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value)
                    if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }))
                  }}
                  placeholder="0"
                  className={`${inputClass} pr-16 ${errors.quantity ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-on-surface-variant">
                  Units
                </span>
              </div>
              {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
            </div>

            <div>
              <label className={labelClass}>Sale Price</label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                  ₱
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => {
                    setSalePrice(e.target.value)
                    if (errors.salePrice) setErrors((prev) => ({ ...prev, salePrice: '' }))
                  }}
                  placeholder="0.00"
                  className={`${inputClass} pl-7 ${errors.salePrice ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.salePrice && <p className="mt-1 text-xs text-red-500">{errors.salePrice}</p>}
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {STATUS_OPTIONS.map((option) => {
                  const active = status === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatus(option)}
                      className={[
                        'flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors',
                        active
                          ? 'border-primary bg-primary/[0.06] text-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary/40',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex h-3.5 w-3.5 items-center justify-center rounded-full border-2',
                          active ? 'border-primary' : 'border-outline-variant',
                        ].join(' ')}
                      >
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </span>
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Batch Preview</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative mt-1.5 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Batch preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <ImagePlus size={26} />
                    <span className="text-sm font-semibold">Batch Preview</span>
                    <span className="text-xs">Click to upload or drag &amp; drop</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {errors.image && <p className="mt-2 text-xs text-red-500">{errors.image}</p>}

              <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-surface-variant/60 p-3">
                <div>
                  <p className="text-xs text-on-surface-variant">Est. Valuation</p>
                  <p className="text-sm font-bold text-on-surface">{formatPeso(estValuation)}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Margin</p>
                  <p
                    className={[
                      'text-sm font-bold',
                      margin >= 0 ? 'text-success' : 'text-error',
                    ].join(' ')}
                  >
                    {margin.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Size ({unit})</label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sizeSqft}
                  onChange={(e) => {
                    setSizeSqft(e.target.value)
                    if (errors.sizeSqft) setErrors((prev) => ({ ...prev, sizeSqft: '' }))
                  }}
                  placeholder="0.00"
                  className={`${inputClass} pr-14 ${errors.sizeSqft ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-on-surface-variant">
                  {unit}
                </span>
              </div>
              {errors.sizeSqft && <p className="mt-1 text-xs text-red-500">{errors.sizeSqft}</p>}
            </div>

            <div>
              <label className={labelClass}>Unit Price</label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                  ₱
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => {
                    setUnitPrice(e.target.value)
                    if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: '' }))
                  }}
                  placeholder="0.00"
                  className={`${inputClass} pl-7 ${errors.unitPrice ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.unitPrice && <p className="mt-1 text-xs text-red-500">{errors.unitPrice}</p>}
            </div>

            <div>
              <label className={labelClass}>Source / Company</label>
              <input
                type="text"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value)
                  if (errors.source) setErrors((prev) => ({ ...prev, source: '' }))
                }}
                placeholder="Supplier or Tannery"
                className={`mt-1.5 ${inputClass} ${errors.source ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
              />
              {errors.source && <p className="mt-1 text-xs text-red-500">{errors.source}</p>}
            </div>
          </div>

        <div className="mt-7 flex flex-wrap items-center justify-end gap-4 border-t border-outline-variant pt-6">
          {justSaved && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
              <BadgeCheck size={16} /> Leather batch saved
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
          >
            <Save size={16} /> Save Leather Entry
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Recently Added</h3>
            <p className="text-xs text-on-surface-variant">Newest leather batches added to the system.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/manage-leather/history')}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
          >
            View Full History <ChevronRight size={14} />
          </button>
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
              {recentLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-on-surface-variant">
                    Loading recently added batches...
                  </td>
                </tr>
              ) : recentError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-red-500">
                    {recentError}
                  </td>
                </tr>
              ) : recentlyAdded.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-on-surface-variant">
                    No recently added batches yet.
                  </td>
                </tr>
              ) : (
                recentlyAdded.map((row) => (
                  <tr
                    key={`${row.batch_code}-${row.added}`}
                    className="border-b border-outline-variant last:border-0"
                  >
                    <td className="px-5 py-3 font-semibold text-on-surface">{row.batch_code}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{row.material_name}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{row.leather_type}</td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {formatNumber(row.size_sqft, 1)} {unitForType(row.leather_type)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">{row.added}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="rounded-lg border border-outline-variant bg-surface px-3 py-1 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEntry(row.batch_code)}
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

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Edit Batch {editingEntry.batch_code}</h2>
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
                  value={editingEntry.batch_code}
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

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-on-surface-variant">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 min-h-24 w-full resize-none rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface-variant">Tag</label>
                <select
                  value={editData.tag || 'None'}
                  onChange={(e) => setEditData((prev) => ({ ...prev, tag: e.target.value === 'None' ? '' : e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {TAG_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
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
                <label className="block text-sm font-semibold text-on-surface-variant">Size ({editUnit})</label>
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
                  {STATUS_OPTIONS.map((option) => (
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
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
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