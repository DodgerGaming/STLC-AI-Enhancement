import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import StatusPill from '../components/StatusPill.jsx'
import { unitForType } from '../data/mockLeather.js'
import { formatPeso, formatNumber } from '../utils/format.js'

const STORAGE_KEY = 'manageLeatherHistory'

function loadHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export default function ManageLeatherHistory() {
  const navigate = useNavigate()
  const [historyItems, setHistoryItems] = useState(() => loadHistory())

  useEffect(() => {
    setHistoryItems(loadHistory())
  }, [])

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/manage-leather')}
          className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-on-surface transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Full Leather History</h1>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            All inventory entries saved from the Manage Leather form.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
        <div className="border-b border-outline-variant px-5 py-4">
          <h3 className="text-sm font-bold text-on-surface">Inventory History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-variant/60 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                <th className="px-5 py-3">Batch ID</th>
                <th className="px-5 py-3">Material</th>
                <th className="px-5 py-3">Leather Type</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-on-surface-variant">
                    No history entries found. Add a leather batch first.
                  </td>
                </tr>
              ) : (
                historyItems.map((item, index) => (
                  <tr key={`${item.batch_code}-${index}`} className="border-b border-outline-variant last:border-0">
                    <td className="px-5 py-3 font-semibold text-on-surface">{item.batch_code}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{item.material_name}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{item.leather_type}</td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {formatNumber(item.size_sqft, 2)} {unitForType(item.leather_type)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">{item.added}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
