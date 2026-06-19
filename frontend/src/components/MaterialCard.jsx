import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ShoppingCart, Minus } from 'lucide-react'
import leatherPlaceholder from '../assets/leather-placeholder.jpg'
import { formatPeso, formatNumber } from '../utils/format.js'
import { SCRAP_UNIT } from '../data/mockLeather.js'
import { fetchBatchesForMaterial } from '../data/apiLeather.js'
import { useCart } from '../context/CartContext.jsx'

const TAG_STYLES = {
  'Best Seller': 'bg-primary text-surface',
  'Low Stock': 'bg-error text-surface',
  Sale: 'bg-success text-surface',
}

const isTimeInRange = (time) => {
  if (!time) return false
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  const minTime = 10 * 60
  const maxTime = 17 * 60
  return totalMinutes >= minTime && totalMinutes <= maxTime
}

const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function MaterialCard({ material }) {
  const navigate = useNavigate()
  const {
    addToCart,
    customerName,
    setCustomerName,
    fulfillment,
    setFulfillment,
    deliveryAddress,
    setDeliveryAddress,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    paymentMethod,
    setPaymentMethod,
  } = useCart()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [selectedBatchCode, setSelectedBatchCode] = useState('')
  const [qty, setQty] = useState(1)
  const [localCustomer, setLocalCustomer] = useState(customerName || '')
  const [added, setAdded] = useState(false)
  const [cutOption, setCutOption] = useState('No cutting')
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [cutError, setCutError] = useState('')
  const [batchError, setBatchError] = useState('')
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [attemptedDetails, setAttemptedDetails] = useState(false)
  const [fulfillmentError, setFulfillmentError] = useState('')

  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  const availableBatches = batches.filter((b) => b.status === 'Available')

  const getFulfillmentError = () => {
    if (!fulfillment) return 'Choose Delivery or Pick-up for this order.'
    if (fulfillment === 'Delivery' && !deliveryAddress.trim()) return 'Enter delivery address.'
    if (!scheduledDate) return 'Select a date.'
    if (!scheduledTime) return 'Select a time.'
    if (!isTimeInRange(scheduledTime)) return 'Time must be between 10:00 AM and 5:00 PM.'
    if (!paymentMethod) return 'Select a payment method.'
    return ''
  }

  const openQuickAdd = async (e) => {
    e.stopPropagation()
    setLoadingBatches(true)
    setLocalCustomer(customerName || '')
    setQty(1)
    setAdded(false)
    setCutError('')
    setBatchError('')
    setFulfillmentError('')
    setDetailsModalOpen(false)
    setAttemptedDetails(false)

    try {
      const fetchedBatches = await fetchBatchesForMaterial(material.material_id)
      setBatches(fetchedBatches)
      setSelectedBatchCode('')
      setCutOption('No cutting')
      setCustomWidth('')
      setCustomHeight('')
      setQuickAddOpen(true)
    } catch (error) {
      console.error('Unable to load batches', error)
    } finally {
      setLoadingBatches(false)
    }
  }

  const closeQuickAdd = (e) => {
    e?.stopPropagation()
    setQuickAddOpen(false)
  }

  const selectedBatch = availableBatches.find((b) => b.batch_code === selectedBatchCode)

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (!selectedBatch) {
      setBatchError('Select a hide / batch before buying.')
      return
    }
    setBatchError('')
    if (!cutOption) {
      setCutError('Please select a cutting option')
      return
    }
    if (cutOption === 'Cut leather' && (!customWidth.trim() || !customHeight.trim())) {
      setCutError('Please enter the requested width and height')
      return
    }
    setCutError('')

    const fulfillmentMsg = getFulfillmentError()
    if (fulfillmentMsg) {
      setAttemptedDetails(true)
      setFulfillmentError(fulfillmentMsg)
      setDetailsModalOpen(true)
      return
    }
    setFulfillmentError('')

    if (localCustomer.trim()) setCustomerName(localCustomer.trim())
    addToCart({
      materialId: material.material_id,
      materialName: material.material_name,
      batchCode: selectedBatch.batch_code,
      sizeSqft: selectedBatch.size_sqft,
      unit: material.unit,
      unitPrice: material.sale_price,
      qty,
      color: material.tint,
      customSize: cutOption === 'Cut leather' ? `${customWidth.trim()} x ${customHeight.trim()}` : '',
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
            disabled={loadingBatches}
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
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-popover"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: material.tint }} />
                <div>
                  <p className="text-sm font-extrabold text-on-surface">{material.material_name}</p>
                  <p className="text-xs text-on-surface-variant">{formatPeso(material.sale_price)} / {material.unit}</p>
                </div>
              </div>
              <button type="button" onClick={closeQuickAdd} className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-variant">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

              {/* ── CUSTOMER LOGISTICS ── */}
              <div className="rounded-xl border border-outline-variant bg-surface-variant/30 px-4 py-3 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Customer Logistics</p>

                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Customer Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={localCustomer}
                    onChange={(e) => setLocalCustomer(e.target.value)}
                    placeholder="e.g. Juan De Cruz"
                    className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Fulfillment</label>
                  <div className="mt-1.5 flex w-fit rounded-lg border border-outline-variant bg-surface p-1 text-xs font-semibold">
                    {['Delivery', 'Pick-up'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => { setFulfillment(option); if (fulfillmentError) setFulfillmentError('') }}
                        className={['rounded-md px-4 py-1.5 transition-colors', fulfillment === option ? 'bg-primary text-surface' : 'text-on-surface-variant hover:text-on-surface'].join(' ')}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {fulfillment && (
                  <button
                    type="button"
                    onClick={() => { setAttemptedDetails(false); setDetailsModalOpen(true) }}
                    className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-variant"
                  >
                    {!getFulfillmentError() ? '✓ ' : ''}{fulfillment === 'Delivery' ? 'Add Delivery Details' : 'Add Pick-up Details'}
                  </button>
                )}
                {fulfillmentError && <p className="text-xs text-error">{fulfillmentError}</p>}
              </div>

              {/* ── MATERIAL CUSTOMIZATIONS ── */}
              <div className="rounded-xl border border-outline-variant bg-surface-variant/30 px-4 py-3 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Material Customizations</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant">Select Sizing Batch</label>
                    <select
                      value={selectedBatchCode}
                      onChange={(e) => { setSelectedBatchCode(e.target.value); if (batchError) setBatchError('') }}
                      className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="" disabled>Choose Hide / Batch</option>
                      {availableBatches.map((b) => (
                        <option key={b.batch_code} value={b.batch_code}>
                          {b.batch_code} — {formatNumber(b.size_sqft, 2)} {material.unit}
                        </option>
                      ))}
                    </select>
                    {batchError && <p className="mt-1 text-xs text-error">{batchError}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant">Quantity (hides)</label>
                    <div className="mt-1.5 flex w-fit items-center rounded-lg border border-outline-variant bg-surface">
                      <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center text-on-surface-variant hover:text-primary">
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-on-surface">{qty}</span>
                      <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} className="flex h-9 w-9 items-center justify-center text-on-surface-variant hover:text-primary">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Cutting Choice</label>
                  <select
                    value={cutOption}
                    onChange={(e) => {
                      setCutOption(e.target.value)
                      if (cutError) setCutError('')
                      if (e.target.value !== 'Cut leather') { setCustomWidth(''); setCustomHeight('') }
                    }}
                    className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="No cutting">No cutting</option>
                    <option value="Cut leather">Cut leather</option>
                  </select>
                </div>

                {selectedBatch && (
                  <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">Computed Net Size</p>
                      <p className="mt-0.5 text-[10px] text-on-surface-variant">
                        {qty} hide{qty !== 1 ? 's' : ''} × {formatNumber(selectedBatch.size_sqft, 2)} {material.unit} per hide
                      </p>
                    </div>
                    <p className="text-xl font-extrabold tabular-nums text-on-surface">
                      {formatNumber(selectedBatch.size_sqft * qty, 2)}
                      <span className="ml-1 text-xs font-semibold text-on-surface-variant">{material.unit}</span>
                    </p>
                  </div>
                )}

                {cutOption === 'Cut leather' && (
                  <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant">Width</label>
                      <div className="relative mt-1.5">
                        <input
                          type="text"
                          value={customWidth}
                          onChange={(e) => { setCustomWidth(e.target.value); if (cutError) setCutError('') }}
                          placeholder="Width"
                          className="w-full rounded-lg border border-outline-variant bg-surface py-2 pl-3 pr-12 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-on-surface-variant">sqft</span>
                      </div>
                    </div>
                    <div className="flex h-9 items-center justify-center">
                      <div className="h-px w-3 bg-outline-variant" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant">Height</label>
                      <div className="relative mt-1.5">
                        <input
                          type="text"
                          value={customHeight}
                          onChange={(e) => { setCustomHeight(e.target.value); if (cutError) setCutError('') }}
                          placeholder="Height"
                          className="w-full rounded-lg border border-outline-variant bg-surface py-2 pl-3 pr-12 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-on-surface-variant">sqft</span>
                      </div>
                    </div>
                  </div>
                )}
                {cutError && <p className="text-xs text-error">{cutError}</p>}
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-outline-variant px-5 pb-5 pt-4">
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-bold text-on-surface">{formatPeso(material.sale_price * qty)}</span>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  !selectedBatch ||
                  !localCustomer.trim() ||
                  !cutOption ||
                  (cutOption === 'Cut leather' && (!customWidth.trim() || !customHeight.trim()))
                }
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

      {/* Order Details — fulfillment specifics, same fields as the main Order Details modal */}
      {detailsModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-dark/50 px-4 backdrop-blur-[2px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface shadow-popover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-outline-variant px-5 py-4">
              <div>
                <p className="text-sm font-bold text-on-surface">Order Details</p>
                <p className="text-xs text-on-surface-variant">
                  {fulfillment} selected. This applies to your whole order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-variant"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {fulfillment === 'Delivery' && (
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Delivery Address</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full delivery address"
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {attemptedDetails && !deliveryAddress.trim() && (
                    <p className="mt-1.5 text-xs font-semibold text-error">Delivery address is required.</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Payment Method</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {['Over the Counter', 'Online Payment', 'COD'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        paymentMethod === method
                          ? 'border-primary bg-primary/[0.08] text-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
                {attemptedDetails && !paymentMethod && (
                  <p className="mt-1.5 text-xs font-semibold text-error">Select a payment method.</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={getTodayDate()}
                    className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {attemptedDetails && !scheduledDate && (
                    <p className="mt-1.5 text-xs font-semibold text-error">Date is required.</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min="10:00"
                    max="17:00"
                    className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {attemptedDetails && !scheduledTime && (
                    <p className="mt-1.5 text-xs font-semibold text-error">Time is required.</p>
                  )}
                  {attemptedDetails && scheduledTime && !isTimeInRange(scheduledTime) && (
                    <p className="mt-1.5 text-xs font-semibold text-error">Time must be 10:00 AM–5:00 PM.</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">Available scheduling hours are 10:00 AM to 5:00 PM.</p>
            </div>

            <div className="border-t border-outline-variant px-5 pb-5 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAttemptedDetails(true)
                  const msg = getFulfillmentError()
                  if (msg) {
                    setFulfillmentError(msg)
                    return
                  }
                  setFulfillmentError('')
                  setDetailsModalOpen(false)
                }}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}