import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import StatusPill from '../components/StatusPill.jsx'
import { formatNumber } from '../utils/format.js'

const STORAGE_KEY = 'auditTrailEntries'

const SAMPLE_AUDIT_ENTRIES = [
  {
    id: 1,
    timestamp: '2026-06-18 08:15 AM',
    user: 'Admin',
    action: 'Created leather batch LW-2024-089',
    batch_code: 'LW-2024-089',
    status: 'Completed',
  },
  {
    id: 2,
    timestamp: '2026-06-18 09:05 AM',
    user: 'SalesClerk',
    action: 'Updated batch LW-2024-089 status to Available',
    batch_code: 'LW-2024-089',
    status: 'Available',
  },
  {
    id: 3,
    timestamp: '2026-06-18 09:45 AM',
    user: 'Admin',
    action: 'Added batch LW-2024-091 to inventory',
    batch_code: 'LW-2024-091',
    status: 'Reserved',
  },
]

function loadAuditTrail() {
  if (typeof window === 'undefined') return SAMPLE_AUDIT_ENTRIES
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SAMPLE_AUDIT_ENTRIES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_AUDIT_ENTRIES
  } catch {
    return SAMPLE_AUDIT_ENTRIES
  }
}

export default function AuditTrail() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState(() => loadAuditTrail())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    setEntries(loadAuditTrail())
  }, [])

  const filteredEntries = entries.filter((entry) => {
    const normalizedFilter = searchTerm.trim().toLowerCase()
    const matchesStatus = statusFilter === 'All' || entry.status === statusFilter
    const matchesSearch = !normalizedFilter ||
      [entry.timestamp, entry.user, entry.action, entry.batch_code, entry.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedFilter)
    return matchesStatus && matchesSearch
  })

  const statuses = ['All', ...Array.from(new Set(entries.map((entry) => entry.status || 'Info')))]

  return (
    <div>
      <div>
        <h1 className="text-2xl font-extrabold text-on-surface">Audit Trail</h1>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          System audit records for leather inventory activity.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
        <div className="border-b border-outline-variant px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Audit Trail Log</h3>
              <p className="mt-1 text-xs text-on-surface-variant">
                Filter entries by keyword or status.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(180px,220px)_200px]">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, action, batch..."
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-variant/60 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                <th className="px-5 py-3">Date / Time</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Batch</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-on-surface-variant">
                    {entries.length === 0
                      ? 'No audit trail entries found. System activity will appear here.'
                      : 'No entries match the current search and filters.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => (
                  <tr key={`${entry.id || index}`} className="border-b border-outline-variant last:border-0">
                    <td className="px-5 py-3 text-on-surface-variant">{entry.timestamp}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{entry.user}</td>
                    <td className="px-5 py-3 text-on-surface">{entry.action}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{entry.batch_code || '—'}</td>
                    <td className="px-5 py-3"><StatusPill status={entry.status || 'Info'} /></td>
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
