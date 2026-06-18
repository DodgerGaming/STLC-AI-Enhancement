import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ShoppingCart, Minus } from 'lucide-react'
import leatherPlaceholder from '../assets/leather-placeholder.jpg'
import { formatPeso, formatNumber } from '../utils/format.js'
import { SCRAP_UNIT, getBatchesForMaterial } from '../data/mockLeather.js'
import { useCart } from '../context/CartContext.jsx'

const TAG_STYLES = {
  'Best Seller': 'bg-primary text-surface',
  'Low Stock': 'bg-error text-surface',
  Sale: 'bg-success text-surface',
}

export default function MaterialCard({ material }) {
  const navigate = useNavigate()
  const { addToCart, customerName, setCustomerName } = useCart()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [selectedBatchCode, setSelectedBatchCode] = useState('')
  const [qty, setQty] = useState(1)
  const [localCustomer, setLocalCustomer] = useState(customerName || '')
  const [customSize, setCustomSize] = useState('')
  const [added, setAdded] = useState(false)

  const batches = getBatchesForMaterial(material.material_id)
  const availableBatches = batches.filter((b) => b.status === 'Available')

  const openQuickAdd = (e) => {
    e.stopPropagation()
    const first = availableBatches[0]
    setSelectedBatchCode(first?.batch_code ?? '')
    setLocalCustomer(customerName || '')
    setCustomSize('')
    setQty(1)
    setAdded(false)
    setQuickAddOpen(true)
  }

  const closeQuickAdd = (e) => {
    e?.stopPropagation()
    setQuickAddOpen(false)
  }

  const selectedBatch = availableBatches.find((b) => b.batch_code === selectedBatchCode) ?? availableBatches[0]

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (!selectedBatch) return
    if (localCustomer.trim()) setCustomerName(localCustomer.trim())
    addToCart({
      materialId: material.material_id,
      materialName: material.material_name,
      batchCode: selectedBatch.batch_code,
      sizeSqft: selectedBatch.size_sqft,
      customSize: customSize.trim() || null,
      unit: material.unit,
      unitPrice: material.sale_price,
      qty,
      color: material.tint,
    })
    setAdded(true)
    setTimeout(() => {
      setQuickAddOpen(false)
      setAdded(false)
    }, 900)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/sales/${material.material_id}`)}
        onKeyDown={(e) => e.key === 'Enter' && navigate(`/sales/${material.material_id}`)}
        className="group cursor-pointer rounded-xl border border-outline-variant bg-surface shadow-card transition-shadow hover:shadow-popover"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
          <img
            src={leatherPlaceholder}
            alt={`${material.material_name} texture`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ backgroundColor: material.tint, opacity: 0.55 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

          {material.tag && (
            <span
              className={[
                'absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm',
                TAG_STYLES[material.tag] || 'bg-surface text-on-surface',
              ].join(' ')}
            >
              {material.tag}
            </span>
          )}

          {/* Quick-add + button */}
          <button
            type="button"
            aria-label={`Quick add ${material.material_name} to cart`}
            onClick={openQuickAdd}
            disabled={availableBatches.length === 0}
            className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-surface shadow-md transition-transform hover:scale-110 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-4 pb-4 pt-5">
          <p className="truncate text-sm font-bold text-on-surface">{material.material_name}</p>
          <p className="mt-0.5 text-sm font-semibold text-primary">
            {formatPeso(material.sale_price)}{' '}
            <span className="text-xs font-medium text-on-surface-variant">/ {material.unit}</span>
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-outline-variant pt-3 text-xs">
            <div>
              <p className="text-on-surface-variant">SKU</p>
              <p className="font-semibold text-on-surface">{material.sku}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">In Stock</p>
              <p className="font-semibold text-on-surface">
                {formatNumber(material.totalStock, material.unit === SCRAP_UNIT ? 1 : 0)} {material.unit}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-add modal */}
      {quickAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 px-4 backdrop-blur-[2px]"
          onClick={closeQuickAdd}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface shadow-popover"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-outline-variant px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-8 w-8 rounded-full"
                  style={{ backgroundColor: material.tint }}
                />
                <div>
                  <p className="text-sm font-bold text-on-surface">{material.material_name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {formatPeso(material.sale_price)} / {material.unit}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeQuickAdd}
                className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-variant"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {/* Customer name */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">
                  Customer Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={localCustomer}
                  onChange={(e) => setLocalCustomer(e.target.value)}
                  placeholder="Enter customer name"
                  className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Batch selector */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Select Batch</label>
                <select
                  value={selectedBatchCode}
                  onChange={(e) => setSelectedBatchCode(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {availableBatches.map((b) => (
                    <option key={b.batch_code} value={b.batch_code}>
                      {b.batch_code} — {formatNumber(b.size_sqft, 2)} {material.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom size requested */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">
                  Size Requested by Customer
                </label>
                <input
                  type="text"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  placeholder={`e.g. 10 ${material.unit} or 2.5m × 1m`}
                  className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {selectedBatch && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Batch size: {formatNumber(selectedBatch.size_sqft, 2)} {material.unit}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Quantity (hides)</label>
                <div className="mt-1.5 flex w-fit items-center rounded-lg border border-outline-variant">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center text-on-surface-variant hover:text-primary"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-on-surface">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    className="flex h-9 w-9 items-center justify-center text-on-surface-variant hover:text-primary"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-outline-variant px-5 pb-5 pt-4">
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-bold text-on-surface">
                  {formatPeso(material.sale_price * qty)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedBatch || !localCustomer.trim()}
                className={[
                  'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors',
                  added
                    ? 'bg-success text-surface'
                    : 'bg-primary text-surface hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50',
                ].join(' ')}
              >
                <ShoppingCart size={16} />
                {added ? 'Added!' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}