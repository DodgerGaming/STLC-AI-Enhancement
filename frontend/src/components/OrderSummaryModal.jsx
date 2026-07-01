import { X, ShoppingBag, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { formatPeso, formatNumber } from '../utils/format.js'

const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isTimeInRange = (time) => {
  if (!time) return false
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  const minTime = 10 * 60
  const maxTime = 17 * 60
  return totalMinutes >= minTime && totalMinutes <= maxTime
}

export default function OrderSummaryModal() {
  const navigate = useNavigate()
  const {
    items,
    itemCount,
    removeFromCart,
    itemsSubtotal,
    cuttingFee,
    total,
    isSummaryOpen,
    closeSummary,
    setCustomerName,
    setFulfillment,
    setDeliveryAddress,
    setScheduledDate,
    setScheduledTime,
    setPaymentMethod,
    setOrderDescription,
    confirmSale,
  } = useCart()

  const [localCustomerName, setLocalCustomerName] = useState('')
  const [localFulfillment, setLocalFulfillment] = useState('')
  const [localDeliveryAddress, setLocalDeliveryAddress] = useState('')
  const [localScheduledDate, setLocalScheduledDate] = useState('')
  const [localScheduledTime, setLocalScheduledTime] = useState('')
  const [localPaymentMethod, setLocalPaymentMethod] = useState('Over the Counter')
  const [localOrderDescription, setLocalOrderDescription] = useState('')
  const [errors, setErrors] = useState({})

  const shipping = localFulfillment === 'Delivery' ? 250 : 0
  const finalTotal = itemsSubtotal + shipping + cuttingFee

  const validateAndSave = async () => {
    const newErrors = {}

    if (!localCustomerName.trim()) {
      newErrors.customerName = 'Customer name is required'
    }
    if (!localFulfillment) {
      newErrors.fulfillment = 'Choose Delivery or Pick-up'
    }
    if (localFulfillment === 'Delivery' && !localDeliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required'
    }
    if (!localScheduledDate) {
      newErrors.scheduledDate = 'Date is required'
    }
    if (!localScheduledTime) {
      newErrors.scheduledTime = 'Time is required'
    }
    if (localScheduledTime && !isTimeInRange(localScheduledTime)) {
      newErrors.scheduledTime = 'Time must be 10:00 AM - 5:00 PM'
    }
    if (!localPaymentMethod) {
      newErrors.paymentMethod = 'Payment method is required'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        setCustomerName(localCustomerName.trim())
        setFulfillment(localFulfillment)
        setDeliveryAddress(localDeliveryAddress)
        setScheduledDate(localScheduledDate)
        setScheduledTime(localScheduledTime)
        setPaymentMethod(localPaymentMethod)
        setOrderDescription(localOrderDescription)

        await confirmSale()
        
        // Clear local state to reset input fields
        setLocalCustomerName('')
        setLocalFulfillment('')
        setLocalDeliveryAddress('')
        setLocalScheduledDate('')
        setLocalScheduledTime('')
        setLocalPaymentMethod('Over the Counter')
        setLocalOrderDescription('')
        setErrors({})
        
        navigate('/dashboard')
      } catch (error) {
        console.error('Order confirmation failed', error)
      }
    }
  }

  if (!isSummaryOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 px-4 backdrop-blur-[2px]"
      onClick={closeSummary}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface shadow-popover"
      >
        <div className="flex items-start justify-between border-b border-outline-variant px-6 py-5">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">Order Details</h2>
            <p className="text-xs text-on-surface-variant">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in this order
            </p>
          </div>
          <button
            type="button"
            onClick={closeSummary}
            aria-label="Close order details"
            className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-variant"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Order Details Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-on-surface">Customer Information</h3>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant">
                  Customer Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={localCustomerName}
                  onChange={(e) => {
                    setLocalCustomerName(e.target.value)
                    if (errors.customerName) setErrors({ ...errors, customerName: '' })
                  }}
                  placeholder="e.g. Juan De Cruz"
                  className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.customerName && <p className="mt-1 text-xs text-error">{errors.customerName}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant">
                  Fulfillment <span className="text-error">*</span>
                </label>
                <div className="mt-1.5 flex gap-2">
                  {['Delivery', 'Pick-up'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setLocalFulfillment(option)
                        if (errors.fulfillment) setErrors({ ...errors, fulfillment: '' })
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                        localFulfillment === option
                          ? 'bg-primary text-surface'
                          : 'border border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors.fulfillment && <p className="mt-1 text-xs text-error">{errors.fulfillment}</p>}
              </div>

              {localFulfillment === 'Delivery' && (
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Delivery Address <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={localDeliveryAddress}
                    onChange={(e) => {
                      setLocalDeliveryAddress(e.target.value)
                      if (errors.deliveryAddress) setErrors({ ...errors, deliveryAddress: '' })
                    }}
                    placeholder="Full address"
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.deliveryAddress && <p className="mt-1 text-xs text-error">{errors.deliveryAddress}</p>}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Material Description</label>
                <div className="mt-1.5 rounded-lg border border-outline-variant bg-surface-variant/40 px-3 py-2.5 text-xs text-on-surface max-h-[100px] overflow-y-auto">
                  {items.length > 0 ? (
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div key={idx}>
                          <p className="font-semibold text-on-surface text-[11px]">{item.materialName}</p>
                          <p className="text-on-surface-variant text-[10px]">
                            {item.materialDescription || 'No description available'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-on-surface-variant">No items in order</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant">
                  Payment Method <span className="text-error">*</span>
                </label>
                <select
                  value={localPaymentMethod}
                  onChange={(e) => {
                    setLocalPaymentMethod(e.target.value)
                    if (errors.paymentMethod) setErrors({ ...errors, paymentMethod: '' })
                  }}
                  className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option>Over the Counter</option>
                  <option>Online Payment</option>
                  {localFulfillment === 'Delivery' && <option>COD</option>}
                </select>
                {errors.paymentMethod && <p className="mt-1 text-xs text-error">{errors.paymentMethod}</p>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={localScheduledDate}
                    onChange={(e) => {
                      setLocalScheduledDate(e.target.value)
                      if (errors.scheduledDate) setErrors({ ...errors, scheduledDate: '' })
                    }}
                    min={getTodayDate()}
                    className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.scheduledDate && <p className="mt-1 text-xs text-error">{errors.scheduledDate}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Time <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    value={localScheduledTime}
                    onChange={(e) => {
                      setLocalScheduledTime(e.target.value)
                      if (errors.scheduledTime) setErrors({ ...errors, scheduledTime: '' })
                    }}
                    min="10:00"
                    max="17:00"
                    className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.scheduledTime && <p className="mt-1 text-xs text-error">{errors.scheduledTime}</p>}
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">Operating hours: 10:00 AM - 5:00 PM</p>
            </div>

            {/* Right: Items Summary */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-on-surface">Items</h3>

              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <ShoppingBag size={28} className="text-on-surface-variant" />
                  <p className="text-sm text-on-surface-variant">Your cart is empty</p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[300px] overflow-y-auto">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-lg border border-outline-variant bg-surface-variant/30 p-2">
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-on-surface">{item.materialName}</p>
                          <p className="text-[10px] text-on-surface-variant">Batch: {item.batchCode}</p>
                          {item.customSize && (
                            <p className="mt-0.5 text-[10px] font-semibold text-primary">
                              ✂️ {item.customSize}
                            </p>
                          )}
                          <p className="text-[10px] text-on-surface-variant">
                            {formatNumber(item.sizeSqft, 2)} {item.unit} × {item.qty}
                          </p>
                        </div>
                        <div className="shrink-0 text-right flex flex-col items-end gap-1">
                          <p className="text-xs font-bold text-on-surface">
                            {formatPeso(item.unitPrice * item.qty)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="rounded p-1 text-on-surface-variant hover:bg-surface-variant hover:text-error transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Pricing Summary */}
              <div className="border-t border-outline-variant pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>{formatPeso(itemsSubtotal)}</span>
                </div>
                {cuttingFee > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Cutting Fee</span>
                    <span>{formatPeso(cuttingFee)}</span>
                  </div>
                )}
                {shipping > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Shipping</span>
                    <span>{formatPeso(shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-outline-variant pt-1.5 font-bold text-on-surface">
                  <span>Total</span>
                  <span>{formatPeso(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant px-6 py-4 space-y-2">
          <button
            type="button"
            disabled={items.length === 0}
            onClick={validateAndSave}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-surface transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm &amp; Save Sale
          </button>
          <button
            type="button"
            onClick={closeSummary}
            className="w-full rounded-lg py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
          >
            Cancel &amp; Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}