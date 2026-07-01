import StatusPill from './StatusPill.jsx'
import { formatNumber } from '../utils/format.js'

export default function HideInventoryTable({ batches, unit = 'sqft', onSelect, selectedBatchCode }) {
  const visible = batches.filter((batch) => Number(batch.quantity || 0) > 0)

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
      <div className="border-b border-outline-variant bg-surface-variant/50 px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Individual Hide Inventory</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-variant/60 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              <th className="px-5 py-3">Batch Code</th>
              <th className="px-5 py-3">Size ({unit})</th>
              <th className="px-5 py-3">Quantity</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((batch) => {
              const isSelected = batch.batch_code === selectedBatchCode
              const isSelectable = batch.status === 'Available'
              return (
                <tr
                  key={batch.batch_code}
                  className={[
                    'border-b border-outline-variant last:border-0',
                    isSelected ? 'bg-primary/[0.06]' : '',
                  ].join(' ')}
                >
                  <td className="px-5 py-3 font-semibold text-on-surface">{batch.batch_code}</td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatNumber(batch.size_sqft, 2)}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatNumber(batch.quantity, 0)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={batch.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isSelectable ? (
                      <button
                        type="button"
                        onClick={() => onSelect?.(batch)}
                        className={[
                          'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-surface'
                            : 'border-primary text-primary hover:bg-primary hover:text-surface',
                        ].join(' ')}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    ) : (
                      <span className="text-xs text-on-surface-variant">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-outline-variant px-5 py-3">
        <p className="text-xs text-on-surface-variant">
          Showing {visible.length} hide{visible.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
