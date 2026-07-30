import { X } from 'lucide-react'
import { formatNumber } from '../utils/format.js'

export default function LowStockDetailsModal({ open, onClose, data }) {
  if (!open) return null

  const hasData = Array.isArray(data) && data.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 px-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-surface shadow-popover"
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">Stock Need by Materials</h2>
            <p className="text-xs text-on-surface-variant">Click any low-stock item to see exact leather type and size needed.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-variant"
            aria-label="Close stock details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <table className="min-w-full table-auto text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-variant/60 font-semibold text-on-surface-variant">
                <th className="whitespace-nowrap px-3 py-2 sm:px-4">Material</th>
                <th className="whitespace-nowrap px-3 py-2 sm:px-4">Leather Type</th>
                <th className="whitespace-nowrap px-3 py-2 sm:px-4">Size (sqft)</th>
                <th className="whitespace-nowrap px-3 py-2 sm:px-4">Quantity</th>
                <th className="whitespace-nowrap px-3 py-2 sm:px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {hasData ? (
                data.map((batch) => (
                  <tr key={batch.batchCode} className="border-b border-outline-variant last:border-0">
                    <td className="whitespace-nowrap px-3 py-2 text-on-surface-variant sm:px-4">{batch.materialName}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-on-surface-variant sm:px-4">{batch.leatherType}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-on-surface-variant sm:px-4">{formatNumber(batch.sizeSqft, 2)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-on-surface-variant sm:px-4">{formatNumber(batch.quantity, 2)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-on-surface-variant sm:px-4">{batch.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-3 py-4 text-sm text-on-surface-variant">No out-of-stock batches yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
