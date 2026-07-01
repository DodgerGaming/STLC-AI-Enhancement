import { formatNumber } from '../utils/format.js'

export default function LowStockDetailsTable({ data }) {
  const hasData = Array.isArray(data) && data.length > 0

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-bold text-on-surface">Stock Needs by Material</h3>
          <p className="text-xs text-on-surface-variant">Shows leather type, exact size, and quantity for out-of-stock batches.</p>
        </div>
        {!hasData && (
          <p className="text-xs text-on-surface-variant">No out-of-stock batch records available yet.</p>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
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
  )
}
