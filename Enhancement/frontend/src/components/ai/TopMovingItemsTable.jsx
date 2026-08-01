import { useState } from 'react'
import { formatPeso } from '../../utils/format.js'

/**
 * TopMovingItemsTable
 *
 * Frontend-only presentational component for the "Top 3 Fast / Slow Moving
 * Items" panel from the AI-enhanced dashboard wireframe. Data (already
 * ranked/sorted) is passed in via props — actual ranking logic will come
 * from the Analytics Engine (Ken's backend / ClickHouse aggregation).
 *
 * @param {{
 *  fastItems?: Array<{ name: string, value: number }>,
 *  slowItems?: Array<{ name: string, value: number }>,
 *  loading?: boolean,
 *  limit?: number
 * }} props
 */
export default function TopMovingItemsTable({
  fastItems = [],
  slowItems = [],
  loading = false,
  limit = 3,
}) {
  const [activeTab, setActiveTab] = useState('fast')

  const items = (activeTab === 'fast' ? fastItems : slowItems).slice(0, limit)

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-on-surface">Top {limit} Fast / Slow Moving Items</h3>

        {/* Segmented pill toggle */}
        <div className="inline-flex rounded-full border border-outline-variant bg-surface-variant p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('fast')}
            className={[
              'rounded-full px-3 py-1.5 transition-colors',
              activeTab === 'fast'
                ? 'bg-primary text-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
          >
            Fast Moving
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slow')}
            className={[
              'rounded-full px-3 py-1.5 transition-colors',
              activeTab === 'slow'
                ? 'bg-primary text-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
          >
            Slow Moving
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-outline-variant">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-variant text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              <th className="px-3 py-2">Leather</th>
              <th className="px-3 py-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              Array.from({ length: limit }).map((_, i) => (
                <tr key={i}>
                  <td className="px-3 py-2.5">
                    <div className="h-3.5 w-24 animate-pulse rounded-full bg-outline-variant/60" />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="ml-auto h-3.5 w-16 animate-pulse rounded-full bg-outline-variant/60" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-xs text-on-surface-variant">
                  No {activeTab === 'fast' ? 'fast' : 'slow'} moving items yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.name}>
                  <td className="px-3 py-2.5 font-medium text-on-surface">{item.name}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-on-surface">
                    {formatPeso(item.value)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}