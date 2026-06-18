import { X, MapPin, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { formatPeso, formatNumber } from '../utils/format.js'

export default function OrderSummaryModal() {
  const navigate = useNavigate()
  const {
    items,
    itemCount,
    fulfillment,
    customerName,
    orderDescription,
    deliveryAddress,
    scheduledDate,
    scheduledTime,
    paymentMethod,
    itemsSubtotal,
    shipping,
    total,
    isSummaryOpen,
    closeSummary,
    confirmSale,
  } = useCart()

  const handleConfirmSale = () => {
    confirmSale()
    navigate('/dashboard')
  }

  if (!isSummaryOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 px-4 backdrop-blur-[2px]"
      onClick={closeSummary}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-popover"
      >
        <div className="flex items-start justify-between border-b border-outline-variant px-6 py-5">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">Order Summary</h2>
            <p className="text-xs text-on-surface-variant">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in this order
            </p>
          </div>
          <button
            type="button"
            onClick={closeSummary}
            aria-label="Close order summary"
            className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-variant"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ShoppingBag size={28} className="text-on-surface-variant" />
              <p className="text-sm text-on-surface-variant">
                Your cart is empty. Add a material from the catalog to get started.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{item.materialName}</p>
                    <p className="text-xs text-on-surface-variant">Batch: {item.batchCode}</p>
                  </div>
                  <div className="text-right text-xs text-on-surface-variant">
                    <p>
                      {formatNumber(item.sizeSqft, 2)} {item.unit} &times; {item.qty}
                    </p>
                    <p>{formatPeso(item.unitPrice)}</p>
                  </div>
                  <p className="w-20 shrink-0 text-right text-sm font-semibold text-on-surface">
                    {formatPeso(item.unitPrice * item.qty)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex items-center justify-between rounded-lg border border-outline-variant bg-surface-variant/50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <MapPin size={16} className="text-primary" />
              Fulfillment Method
            </div>
            <div className="rounded-md border border-outline-variant bg-surface px-3 py-1 text-sm font-semibold text-on-surface">
              {fulfillment || '—'}
            </div>
          </div>

          {(fulfillment === 'Delivery' || fulfillment === 'Pick-up') && (
            <div className="mt-5 rounded-xl border border-outline-variant bg-surface-variant/50 px-4 py-4 text-sm text-on-surface">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-on-surface-variant">Customer</p>
                  <p className="font-semibold text-on-surface">{customerName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Description</p>
                  <p className="font-semibold text-on-surface">{orderDescription || '—'}</p>
                </div>
                {fulfillment === 'Delivery' && (
                  <div>
                    <p className="text-xs text-on-surface-variant">Address</p>
                    <p className="font-semibold text-on-surface">{deliveryAddress || '—'}</p>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-on-surface-variant">Date</p>
                    <p className="font-semibold text-on-surface">{scheduledDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Time</p>
                    <p className="font-semibold text-on-surface">{scheduledTime || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Payment Method</p>
                  <p className="font-semibold text-on-surface">{paymentMethod || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-outline-variant px-6 py-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>Items Subtotal ({itemCount} {itemCount === 1 ? 'unit' : 'units'})</span>
              <span>{formatPeso(itemsSubtotal)}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between text-on-surface-variant">
                <span>Shipping Fee</span>
                <span>{formatPeso(shipping)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-outline-variant pt-1.5 text-base font-bold text-on-surface">
              <span>Total Amount</span>
              <span>{formatPeso(total)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={items.length === 0}
            onClick={handleConfirmSale}
            className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-surface transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm &amp; Save Sale
          </button>
          <button
            type="button"
            onClick={closeSummary}
            className="mt-2 w-full rounded-lg py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
          >
            Cancel &amp; Edit Cart
          </button>
        </div>
      </div>
    </div>
  )
}
