import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import StatusPill from '../components/StatusPill.jsx'
import { formatNumber } from '../utils/format.js'
import { fetchJson } from '../utils/api.js'

export default function AuditTrail() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAuditTrail = async () => {
      try {
        setLoading(true)
        const data = await fetchJson('/audit-trail/?limit=20')
        setEntries(Array.isArray(data) ? data : [])
        setError('')
      } catch (err) {
        setError(err.message || 'Failed to load audit trail')
        setEntries([])
      } finally {
        setLoading(false)
      }
    }

    loadAuditTrail()
  }, [])

  const entityTypes = ['All', ...Array.from(new Set(entries.map((e) => e.entity_type)))]

  const filteredEntries = entries.filter((entry) => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const matchesType = entityTypeFilter === 'All' || entry.entity_type === entityTypeFilter
    const matchesSearch = !normalizedSearch ||
      [entry.timestamp, entry.user, entry.action, entry.entity_id, entry.field_name, entry.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    return matchesType && matchesSearch
  })

  return (
    <div>
      <div>
        <h1 className="text-2xl font-extrabold text-on-surface">Audit Trail</h1>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          System audit records tracking all changes to inventory (excluding status field).
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
        <div className="border-b border-outline-variant px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Audit Log</h3>
              <p className="mt-1 text-xs text-on-surface-variant">
                Filter entries by entity type, user, or field name. Old and new values are tracked.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(180px,220px)_200px]">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, action, field..."
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-on-surface-variant">
              Loading audit trail...
            </div>
          ) : error ? (
            <div className="px-5 py-10">
              <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                {error}
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-variant/60 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  <th className="px-5 py-3">Date / Time</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Field</th>
                  <th className="px-5 py-3">Old Value</th>
                  <th className="px-5 py-3">New Value</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-on-surface-variant">
                      {entries.length === 0
                        ? 'No audit trail entries found.'
                        : 'No entries match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-variant/30">
                      <td className="px-5 py-3 text-xs text-on-surface-variant">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-on-surface">{entry.user}</td>
                      <td className="px-5 py-3 text-sm text-on-surface">
                        <div className="flex flex-col gap-1">
                          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary w-fit">
                            {entry.entity_type}
                          </span>
                          <span className="text-xs text-on-surface-variant">{entry.entity_id}</span>
                          {entry.entity_name && (
                            <span className="text-xs font-medium text-on-surface bg-surface-variant/50 px-2 py-1 rounded w-fit">
                              {entry.entity_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-mono text-on-surface-variant">{entry.field_name}</td>
                      <td className="px-5 py-3 text-sm font-mono text-on-surface-variant max-w-xs truncate">
                        {entry.old_value || '—'}
                      </td>
                      <td className="px-5 py-3 text-sm font-mono text-on-surface-variant max-w-xs truncate">
                        {entry.new_value || '—'}
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                            entry.action === 'CREATE'
                              ? 'bg-success/10 text-success'
                              : entry.action === 'UPDATE'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-error/10 text-error'
                          }`}
                        >
                          {entry.action}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

