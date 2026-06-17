import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react'
import HideInventoryTable from '../components/HideInventoryTable.jsx'
import leatherPlaceholder from '../assets/leather-placeholder.jpg'
import { useCart } from '../context/CartContext.jsx'
import { getMaterialById, getBatchesForMaterial } from '../data/mockLeather.js'
import { formatPeso, formatNumber } from '../utils/format.js'

export default function LeatherDetail() {
  const { materialId } = useParams()
  const navigate = useNavigate()
  const material = getMaterialById(materialId)
  const batches = useMemo(() => getBatchesForMaterial(materialId), [materialId])

  const firstAvailable = batches.find((b) => b.status === 'Available')
  const [selectedBatchCode, setSelectedBatchCode] = useState(firstAvailable?.batch_code ?? '')
  const [quantity, setQuantity] = useState(1)
  const [swatchIndex, setSwatchIndex] = useState(0)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  const {
    fulfillment,
    setFulfillment,
    customerName,
    setCustomerName,
    orderDescription,
    setOrderDescription,
    deliveryAddress,
    setDeliveryAddress,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    addToCart,
    openSummary,
  } = useCart()

  if (!material) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-on-surface-variant">
          We couldn’t find a material with that ID.
        </p>
        <button
          type="button"
          onClick={() => navigate('/sales')}
          className="flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-surface"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>
    )
  }

  const selectedBatch = batches.find((b) => b.batch_code === selectedBatchCode)
  const hasStock = Boolean(firstAvailable)

  const orderReady =
    hasStock &&
    fulfillment &&
    customerName.trim() &&
    (fulfillment === 'Delivery'
      ? scheduledDate && scheduledTime && deliveryAddress.trim()
      : true)

  const buildLine = () => ({
    materialId: material.material_id,
    materialName: material.material_name,
    batchCode: selectedBatch?.batch_code,
    sizeSqft: selectedBatch?.size_sqft ?? 0,
    unit: material.unit,
    unitPrice: material.sale_price,
    qty: quantity,
    color: material.tint,
  })

  const closeDetailsModal = () => setDetailsModalOpen(false)

  const handleBuyNow = () => {
    if (!selectedBatch || !orderReady) return
    addToCart(buildLine())
    openSummary()
    if (detailsModalOpen) closeDetailsModal()
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/sales')}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT — hero image + swatches */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <img
              src={leatherPlaceholder}
              alt={`${material.material_name} texture`}
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 mix-blend-multiply"
              style={{ backgroundColor: material.tint, opacity: 0.55 }}
            />
            <div className="absolute left-3 top-3 flex gap-2">
              <span
                className={[
                  'rounded-full px-3 py-1 text-xs font-bold shadow-sm',
                  hasStock ? 'bg-success text-surface' : 'bg-error text-surface',
                ].join(' ')}
              >
                {hasStock ? 'In Stock' : 'Out of Stock'}
              </span>
              <span className="rounded-full bg-surface/90 px-3 py-1 text-xs font-bold text-on-surface shadow-sm">
                {material.leather_type}
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {material.swatches.map((color, i) => (
              <button
                key={color + i}
                type="button"
                onClick={() => setSwatchIndex(i)}
                aria-label={`Select finish ${i + 1}`}
                className={[
                  'h-11 w-11 rounded-full border-2 transition-transform',
                  swatchIndex === i
                    ? 'border-primary scale-105'
                    : 'border-transparent hover:scale-105',
                ].join(' ')}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* RIGHT — sale entry form */}
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">{material.material_name}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            SKU: {material.sku} · {material.leather_type}
          </p>
          <p className="mt-2 text-xl font-bold text-primary">
            {formatPeso(material.sale_price)}{' '}
            <span className="text-sm font-medium text-on-surface-variant">/ {material.unit}</span>
          </p>

          <div className="mt-5">
            <label className="text-sm font-semibold text-on-surface-variant">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mt-6">
            <label className="text-sm font-semibold text-on-surface-variant">
              Choose Hide / Batch
            </label>
            <select
              value={selectedBatchCode}
              onChange={(e) => setSelectedBatchCode(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {batches.map((b) => (
                <option key={b.batch_code} value={b.batch_code} disabled={b.status !== 'Available'}>
                  Batch {b.batch_code} — {formatNumber(b.size_sqft, 2)} {material.unit} available
                  {b.status !== 'Available' ? ` (${b.status})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-on-surface-variant">
              Quantity
            </label>
            <div className="mt-1.5 flex w-fit items-center rounded-lg border border-outline-variant">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <Minus size={16} />
              </button>
              <span className="w-12 text-center text-sm font-semibold text-on-surface">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="flex h-10 w-10 items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-on-surface-variant">
              Fulfillment
            </label>
            <div className="mt-1.5 flex w-fit rounded-lg border border-outline-variant bg-surface-variant/40 p-1 text-sm font-semibold">
              {['Delivery', 'Pick-up'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFulfillment(option)}
                  className={[
                    'rounded-md px-5 py-1.5 transition-colors',
                    fulfillment === option
                      ? 'bg-primary text-surface'
                      : 'text-on-surface-variant hover:text-on-surface',
                  ].join(' ')}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 space-y-3">
            {fulfillment === '' && (
              <p className="text-sm font-semibold text-error">
                Select Delivery or Pick-up before processing the sale.
              </p>
            )}
            {fulfillment === 'Delivery' && (
              <button
                type="button"
                onClick={() => setDetailsModalOpen(true)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-5 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-variant"
              >
                Add Delivery Details
              </button>
            )}

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!orderReady}
              className="w-full rounded-full bg-primary py-4 text-sm font-bold text-surface transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart size={18} className="inline-block mr-2" /> Buy Now
            </button>
          </div>

          {detailsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl shadow-black/10">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">Order Details</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {fulfillment} selected. Complete the delivery or pick-up details below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDetailsModal}
                    className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-variant"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-on-surface-variant">
                      Description of the leather
                    </label>
                    <textarea
                      value={orderDescription}
                      onChange={(e) => setOrderDescription(e.target.value)}
                      rows={4}
                      className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>


                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-on-surface-variant">
                        Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-on-surface-variant">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={!orderReady}
                      className="w-full rounded-full bg-primary py-4 text-sm font-bold text-surface transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingCart size={18} className="inline-block mr-2" /> Buy Now
                    </button>

                    {!orderReady && (
                      <p className="mt-3 text-sm text-on-surface-variant">
                        Complete customer name, schedule, and {fulfillment === 'Delivery' ? 'delivery address' : 'pick-up schedule'} to continue.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h3 className="mb-3 text-sm font-bold text-on-surface">Individual Hide Inventory</h3>
        <HideInventoryTable
          batches={batches}
          unit={material.unit}
          selectedBatchCode={selectedBatchCode}
          onSelect={(b) => setSelectedBatchCode(b.batch_code)}
        />
      </div>
    </div>
  )
}
