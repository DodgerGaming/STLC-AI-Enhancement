import { ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { formatPeso } from '../utils/format.js'

export default function CartFooter() {
  const { items, itemCount, total, openSummary, clearCart } = useCart()

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant bg-surface shadow-popover lg:ml-[260px]">
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-primary" />
            <div>
              <p className="text-sm font-semibold text-on-surface">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
              </p>
              <p className="text-xs text-on-surface-variant">
                Total: <span className="font-bold text-primary">{formatPeso(total)}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearCart}
              className="rounded-lg border border-outline-variant px-6 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
            >
              Clear Cart
            </button>
            <button
              type="button"
              onClick={openSummary}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
