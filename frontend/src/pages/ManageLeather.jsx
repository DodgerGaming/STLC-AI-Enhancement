import { useRef, useState } from 'react'
import { Plus, ImagePlus, Save, BadgeCheck, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatusPill from '../components/StatusPill.jsx'
import { hideBatches, LEATHER_TYPES, unitForType } from '../data/mockLeather.js'
import { formatPeso, formatNumber } from '../utils/format.js'

const STATUS_OPTIONS = ['Available', 'Processing', 'Reserved']

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

const labelClass = 'text-sm font-semibold text-on-surface-variant'

function agoToHours(ago) {
  const match = /^(\d+)\s*(mo|h|d|w)/.exec(ago ?? '')
  if (!match) return Infinity
  const value = Number(match[1])
  const multiplier = { h: 1, d: 24, w: 24 * 7, mo: 24 * 30 }[match[2]]
  return value * multiplier
}

function buildInitialRecentlyAdded() {
  return [...hideBatches]
    .sort((a, b) => agoToHours(a.added) - agoToHours(b.added))
    .slice(0, 5)
    .map((b) => ({
      batch_code: b.batch_code,
      material_name: b.material_name,
      size_sqft: b.size_sqft,
      leather_type: b.leather_type,
      status: b.status,
      added: b.added,
    }))
}

export default function ManageLeather() {
  const fileInputRef = useRef(null)

  const [batchCode, setBatchCode] = useState('')
  const [materialName, setMaterialName] = useState('')
  const [leatherType, setLeatherType] = useState(LEATHER_TYPES[0])
  const [quantity, setQuantity] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [status, setStatus] = useState('Available')

  const [sizeSqft, setSizeSqft] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [source, setSource] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const navigate = useNavigate()
  const [recentlyAdded, setRecentlyAdded] = useState(buildInitialRecentlyAdded)
  const [justSaved, setJustSaved] = useState(false)

  const unit = unitForType(leatherType)
  const estValuation = (Number(sizeSqft) || 0) * (Number(unitPrice) || 0)
  const margin =
    Number(salePrice) > 0 ? ((Number(salePrice) - Number(unitPrice)) / Number(salePrice)) * 100 : 0

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
  }

  const resetForm = () => {
    setBatchCode('')
    setMaterialName('')
    setLeatherType(LEATHER_TYPES[0])
    setQuantity('')
    setSalePrice('')
    setStatus('Available')
    setSizeSqft('')
    setUnitPrice('')
    setSource('')
    setPreviewUrl(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!batchCode.trim() || !materialName.trim()) return

    const newEntry = {
      batch_code: batchCode.trim(),
      material_name: materialName.trim(),
      leather_type: leatherType,
      quantity: Number(quantity) || 0,
      size_sqft: Number(sizeSqft) || 0,
      unitPrice: Number(unitPrice) || 0,
      salePrice: Number(salePrice) || 0,
      source: source.trim(),
      status,
      added: 'Just now',
    }

    setRecentlyAdded((prev) => [newEntry, ...prev].slice(0, 6))
    window.localStorage.setItem(
      'manageLeatherHistory',
      JSON.stringify([newEntry, ...(JSON.parse(window.localStorage.getItem('manageLeatherHistory') || '[]') || [])]),
    )

    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
    resetForm()
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-surface">
          <Plus size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Add New Leather Batch</h1>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            Register incoming stock into the central inventory system.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-outline-variant bg-surface p-6 shadow-card sm:p-8"
      >
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Batch Code</label>
              <input
                type="text"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                placeholder="e.g. LW-2024-089"
                className={`mt-1.5 ${inputClass}`}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Material Name</label>
              <input
                type="text"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="e.g. Tuscan Pebbled Brown"
                className={`mt-1.5 ${inputClass}`}
                required
              />
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
              <label className={labelClass}>Quantity</label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} pr-16`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-on-surface-variant">
                  Units
                </span>
              </div>
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
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  className={`${inputClass} pl-7`}
                />
              </div>
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
                  onChange={(e) => setSizeSqft(e.target.value)}
                  placeholder="0.00"
                  className={`${inputClass} pr-14`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-on-surface-variant">
                  {unit}
                </span>
              </div>
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
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Source / Company</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Supplier or Tannery"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
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
          <h3 className="text-sm font-bold text-on-surface">Recently Added</h3>
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
              </tr>
            </thead>
            <tbody>
              {recentlyAdded.map((row) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
