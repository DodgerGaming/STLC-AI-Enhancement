import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react'
import HideInventoryTable from '../components/HideInventoryTable.jsx'
import leatherPlaceholder from '../assets/leather-placeholder.jpg'
import { useCart } from '../context/CartContext.jsx'
import { fetchMaterialById, fetchBatchesForMaterial } from '../data/apiLeather.js'
import { formatPeso, formatNumber } from '../utils/format.js'

export default function LeatherDetail() {
  const { materialId } = useParams()
  const navigate = useNavigate()
  const [material, setMaterial] = useState(null)
  const [batches, setBatches] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [pageError, setPageError] = useState('')

  const [selectedBatchCode, setSelectedBatchCode] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [cutOption, setCutOption] = useState('No cutting')
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const availableBatches = batches.filter((b) => Number(b.quantity || 0) > 0)
  const firstAvailable = availableBatches.find((b) => b.status === 'Available')

  useEffect(() => {
    let active = true
    setLoadingData(true)
    setPageError('')

    Promise.all([fetchMaterialById(materialId), fetchBatchesForMaterial(materialId)])
      .then(([materialData, batchesData]) => {
        if (!active) return
        setMaterial(materialData)
        setBatches(batchesData)
        setSelectedBatchCode('')
      })
      .catch((error) => {
        if (!active) return
        setPageError(error.message || 'Unable to load material details')
      })
      .finally(() => {
        if (!active) return
        setLoadingData(false)
      })

    return () => {
      active = false
    }
  }, [materialId])

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
    paymentMethod,
    setPaymentMethod,
    addToCart,
    openSummary,
  } = useCart()

  const selectedBatch = availableBatches.find((b) => b.batch_code === selectedBatchCode)
  // compute total stock: prefer material.totalStock from API, fallback to summing batches
  const computedBatchStock = batches.reduce((sum, b) => sum + (Number(b.size_sqft || 0) * Number(b.quantity || 0)), 0)
  const apiStockValue = material?.totalStock ?? material?.totalstock ?? material?.total_stock
  const totalStock = apiStockValue != null ? Number(apiStockValue) : computedBatchStock
  const hasStock = availableBatches.length > 0
  const tint = material?.tint || '#7A3B23'
  // max purchasable quantity is capped by how many units of the selected batch are actually in stock
  const maxQty = selectedBatch ? Math.max(1, Number(selectedBatch.quantity) || 0) : 99

  const getAutoDescription = () => {
    if (!selectedBatch || !material) return ''
    return `Full hide - ${formatNumber(selectedBatch.size_sqft, 2)} ${material.unit} per hide`
  }

  // keep order description in sync with selection and material description.
  // IMPORTANT: this must stay above the early `return`s below — all hooks need to
  // run on every render (even while loading/erroring) or React throws "Rendered
  // more hooks than during the previous render."
  useEffect(() => {
    const composed = (material?.description ? material.description + ' ' : '') + (getAutoDescription() || '')
    setOrderDescription(composed.trim())
  }, [material, selectedBatch, setOrderDescription])

  // keep quantity within the stock actually available for the selected batch
  useEffect(() => {
    if (selectedBatch) {
      setQuantity((q) => Math.min(Math.max(1, q), maxQty))
    }
  }, [selectedBatchCode])

  if (loadingData) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-on-surface-variant">Loading material details…</p>
      </div>
    )
  }

  if (pageError || !material) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-on-surface-variant">
          {pageError || 'We couldn’t find a material with that ID.'}
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

  const orderReady =
    hasStock &&
    fulfillment &&
    customerName.trim() &&
    (fulfillment === 'Delivery'
      ? scheduledDate && scheduledTime && deliveryAddress.trim()
      : fulfillment === 'Pick-up'
      ? scheduledDate && scheduledTime
      : true)

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

  const getOrderValidationMessage = () => {
    if (!hasStock) return 'Select an available batch before buying.'
    if (!selectedBatch) return 'Select a hide / batch before buying.'
    if (quantity > maxQty) return `Only ${maxQty} unit${maxQty !== 1 ? 's' : ''} available for batch ${selectedBatch.batch_code}.`
    const isValidName = (value) => {
      const v = (value || '').trim()
      return /^[A-Za-z\s]{2,}$/.test(v)
    }

    const isNumeric = (value) => /^\d+(?:\.\d+)?$/.test((value || '').toString())

    if (!customerName.trim() || !isValidName(customerName)) return 'Enter a valid customer name (letters only, min 2 characters).'
    if (!fulfillment) return 'Choose Delivery or Pick-up to proceed.'
    if (fulfillment === 'Delivery') {
      if (!deliveryAddress.trim()) {
        return 'Enter delivery address.'
      }
      if (!scheduledDate) {
        return 'Select a delivery date.'
      }
      if (!scheduledTime) {
        return 'Select a delivery time.'
      }
      if (!isTimeInRange(scheduledTime)) {
        return 'Time must be between 10:00 AM and 5:00 PM.'
      }
      if (!paymentMethod) {
        return 'Select a payment method.'
      }
    }
    if (cutOption === 'Cut leather') {
      if (!customWidth.trim() || !customHeight.trim()) {
        return 'Enter the requested width and height for cutting.'
      }
      if (!isNumeric(customWidth.trim()) || !isNumeric(customHeight.trim())) {
        return 'Width and height must be numbers.'
      }
    }
    if (fulfillment === 'Pick-up') {
      if (!scheduledDate) {
        return 'Select a pick-up date.'
      }
      if (!scheduledTime) {
        return 'Select a pick-up time.'
      }
      if (!isTimeInRange(scheduledTime)) {
        return 'Time must be between 10:00 AM and 5:00 PM.'
      }
      if (!paymentMethod) {
        return 'Select a payment method.'
      }
    }
    return ''
  }

  const getDeliveryAddressError = () => {
    if (attemptedSubmit && fulfillment === 'Delivery' && !deliveryAddress.trim()) return 'Delivery address is required.'
    return ''
  }

  const getScheduledDateError = () => {
    if (attemptedSubmit && (fulfillment === 'Delivery' || fulfillment === 'Pick-up') && !scheduledDate) return 'Date is required.'
    return ''
  }

  const getScheduledTimeError = () => {
    if (attemptedSubmit && (fulfillment === 'Delivery' || fulfillment === 'Pick-up') && !scheduledTime) return 'Time is required.'
    if (
      attemptedSubmit &&
      (fulfillment === 'Delivery' || fulfillment === 'Pick-up') &&
      scheduledTime &&
      !isTimeInRange(scheduledTime)
    ) {
      return 'Time must be between 10:00 AM and 5:00 PM.'
    }
    return ''
  }

  const orderValidationMessage = getOrderValidationMessage()

  const buildLine = () => ({
    materialId: material.material_id,
    materialName: material.material_name,
    batchCode: selectedBatch?.batch_code,
    sizeSqft: selectedBatch?.size_sqft ?? 0,
    unit: material.unit,
    unitPrice: material.sale_price,
    qty: quantity,
    color: tint,
    customSize: cutOption === 'Cut leather' ? `${customWidth.trim()} x ${customHeight.trim()}` : '',
  })

  const closeDetailsModal = () => {
    setDetailsModalOpen(false)
    setAttemptedSubmit(false)
  }

  const handleBuyNow = () => {
    setAttemptedSubmit(true)
    const validation = getOrderValidationMessage()
    if (validation) {
      setValidationMessage(validation)
      return
    }

    setValidationMessage('')
    if (!selectedBatch) return
    addToCart(buildLine())
    openSummary()
    if (detailsModalOpen) closeDetailsModal()
  }

  return (
    <div className="bg-background">
      <button
        type="button"
        onClick={() => navigate('/sales')}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT — hero image */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <img
              src={leatherPlaceholder}
              alt={`${material.material_name} texture`}
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 mix-blend-multiply"
              style={{ backgroundColor: tint, opacity: 0.55 }}
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
              <span className="rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-on-surface shadow-sm">
                {`${formatNumber(totalStock, 2)} ${material?.unit || 'sqft'}`}
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT — sale entry form */}
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">{material.material_name}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{material.leather_type}</p>
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
              <option value="" disabled>
                Choose Hide / Batch
              </option>
              {availableBatches.map((b) => (
                  <option key={b.batch_code} value={b.batch_code} disabled={b.status !== 'Available'}>
                    Batch {b.batch_code} — {formatNumber(b.size_sqft, 2)} {material.unit}, {formatNumber(b.quantity, 0)} in stock
                    {b.status !== 'Available' ? ` (${b.status})` : ''}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,auto)_minmax(240px,1fr)] items-end">
            <div>
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
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  className="flex h-10 w-10 items-center justify-center text-on-surface-variant hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-on-surface-variant"
                >
                  <Plus size={16} />
                </button>
              </div>
              {selectedBatch && (
                <p className="mt-1 text-xs text-on-surface-variant">
                  {maxQty} available for this batch
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant">
                Cutting Option
              </label>
              <select
                value={cutOption}
                onChange={(e) => {
                  setCutOption(e.target.value)
                  if (e.target.value !== 'Cut leather') {
                    setCustomWidth('')
                    setCustomHeight('')
                  }
                }}
                className="mt-1.5 h-10 w-auto min-w-[160px] rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="No cutting">No cutting</option>
                <option value="Cut leather">Cut leather</option>
              </select>
            </div>
          </div>

          {cutOption === 'Cut leather' && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-on-surface-variant">
                  Requested Width
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="Width"
                    className="w-full rounded-lg border border-outline-variant bg-surface py-2 pl-3 pr-12 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-on-surface-variant">
                    sqft
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant">
                  Requested Height
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    placeholder="Height"
                    className="w-full rounded-lg border border-outline-variant bg-surface py-2 pl-3 pr-12 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-on-surface-variant">
                    sqft
                  </span>
                </div>
              </div>
            </div>
          )}

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
            {fulfillment && (
              <button
                type="button"
                onClick={() => setDetailsModalOpen(true)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-5 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-variant"
              >
                {fulfillment === 'Delivery' ? 'Add Delivery Details' : 'Add Pick-up Details'}
              </button>
            )}

            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full rounded-full bg-primary py-4 text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
            >
              <ShoppingCart size={18} className="inline-block mr-2" /> Buy Now
            </button>
            {!detailsModalOpen && validationMessage && (
              <p className="mt-3 text-center text-sm font-semibold text-error">
                {validationMessage}
              </p>
            )}
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
                      Order Description
                    </label>
                    <div className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface-variant/40 px-3 py-2.5 text-sm text-on-surface">
                      {(material.description ? material.description + ' ' : '') + (getAutoDescription() || '')}
                    </div>
                    {selectedBatch && (
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Batch size: {formatNumber(selectedBatch.size_sqft, 2)} {material.unit}
                      </p>
                    )}
                  </div>

                  {fulfillment === 'Delivery' && (
                    <div>
                      <label className="text-sm font-semibold text-on-surface-variant">
                        Delivery Address
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter full delivery address"
                        rows={2}
                        className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {getDeliveryAddressError() && (
                        <p className="mt-1.5 text-xs font-semibold text-error">{getDeliveryAddressError()}</p>
                      )}
                    </div>
                  )}

                    <div>
                    <label className="text-sm font-semibold text-on-surface-variant">
                      Payment Method
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {['Over the Counter', 'Online Payment', ...(fulfillment === 'Delivery' ? ['COD'] : [])].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                            paymentMethod === method
                              ? 'border-primary bg-primary/[0.08] text-primary'
                              : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
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
                        min={getTodayDate()}
                        className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {getScheduledDateError() && (
                        <p className="mt-1.5 text-xs font-semibold text-error">{getScheduledDateError()}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-on-surface-variant">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        min="10:00"
                        max="17:00"
                        className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {getScheduledTimeError() && (
                        <p className="mt-1.5 text-xs font-semibold text-error">{getScheduledTimeError()}</p>
                      )}
                    </div>
                  </div>
                  {(fulfillment === 'Delivery' || fulfillment === 'Pick-up') && (
                    <p className="text-xs text-on-surface-variant">
                      Available scheduling hours are 10:00 AM to 5:00 PM.
                    </p>
                  )}

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="w-full rounded-full bg-primary py-4 text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
                    >
                      <ShoppingCart size={18} className="inline-block mr-2" /> Buy Now
                    </button>

                    {validationMessage && (
                      <p className="mx-auto mt-3 max-w-sm rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold text-error shadow-sm sm:max-w-md">
                        {validationMessage}
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
          batches={availableBatches}
          unit={material.unit}
          selectedBatchCode={selectedBatchCode}
          onSelect={(b) => setSelectedBatchCode(b.batch_code)}
        />
      </div>
    </div>
  )
}