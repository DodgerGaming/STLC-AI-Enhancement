import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import StatusPill from './StatusPill.jsx'
import { formatNumber } from '../utils/format.js'

export default function HideInventoryTable({ batches, unit = 'sqft', onSelect, selectedBatchCode }) {
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    if (!search.trim()) return batches
    const query = search.trim().toLowerCase()
    return batches.filter((batch) =>
      [batch.batch_code, batch.quality_grade, batch.status]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [batches, search])

  const handleSearchChange = (value) => {
    setSearch(value)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
      <div className="border-b border-outline-variant bg-surface-variant/50 px-5 py-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant" htmlFor="hide-search">
          Filter hides
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 py-2">
          <Search size={16} className="text-on-surface-variant" />
          <input
            id="hide-search"
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search batch code, grade, or status"
            className="w-full bg-transparent text-sm text-on-surface outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-variant/60 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              <th className="px-5 py-3">Batch Code</th>
              <th className="px-5 py-3">Size ({unit})</th>
              <th className="px-5 py-3">Quality Grade</th>
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
                  <td className="px-5 py-3 text-on-surface-variant">{batch.quality_grade}</td>
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
          Showing {visible.length} hides{search.trim() ? ` matching "${search.trim()}"` : ''}
        </p>
      </div>
    </div>
  )
}
