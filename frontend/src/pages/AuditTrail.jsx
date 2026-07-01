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
  const [actionFilter, setActionFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const ROLE_OPTIONS = ['All', 'Admin', 'Clerk', 'Supervisor']

  const getActionOptions = () => {
    if (roleFilter === 'Admin') {
      return ['All', 'CREATE', 'DELETE']
    }
    if (roleFilter === 'Clerk' || roleFilter === 'Supervisor') {
      return ['All', 'CREATE', 'UPDATE']
    }
    return ['All', 'CREATE', 'UPDATE', 'DELETE']
  }

  useEffect(() => {
    const validActions = getActionOptions()
    if (!validActions.includes(actionFilter)) {
      setActionFilter('All')
    }
  }, [roleFilter])

  useEffect(() => {
    const loadAuditTrail = async () => {
      try {
        setLoading(true)
        const roleParam = roleFilter !== 'All' ? `&role=${encodeURIComponent(roleFilter)}` : ''
        const actionParam = actionFilter !== 'All' ? `&action=${encodeURIComponent(actionFilter)}` : ''
        const data = await fetchJson(`/audit-trail/?limit=200${roleParam}${actionParam}`)
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
  }, [roleFilter, actionFilter])

  const filteredEntries = entries.filter((entry) => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const entryRole = entry.role || ''
    const matchesAction = actionFilter === 'All' || entry.action === actionFilter
    const matchesRole = roleFilter === 'All' || entryRole.toLowerCase() === roleFilter.toLowerCase()
    const matchesSearch = !normalizedSearch ||
      [entry.timestamp, entry.user, entryRole, entry.action, entry.entity_id, entry.field_name, entry.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    return matchesAction && matchesRole && matchesSearch
  })

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE))
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, actionFilter])

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  return (
    <div>
      <div className="mt-2 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
        <div className="border-b border-outline-variant px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Audit Log</h3>
              <p className="mt-1 text-xs text-on-surface-variant">
                Filter entries by entity type, user, or field name. Old and new values are tracked.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(180px,220px)_160px_160px]">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, action, field..."
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role === 'All' ? 'All Roles' : role}
                  </option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                {getActionOptions().map((action) => (
                  <option key={action} value={action}>
                    {action === 'All' ? 'All Actions' : action.charAt(0) + action.slice(1).toLowerCase()}
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
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Field</th>
                  <th className="px-5 py-3">Old Value</th>
                  <th className="px-5 py-3">New Value</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-on-surface-variant">
                      {entries.length === 0
                        ? 'No audit trail entries found.'
                        : 'No entries match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  paginatedEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-variant/30">
                      <td className="px-5 py-3 text-xs text-on-surface-variant">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-on-surface">{entry.user}</td>
                      <td className="px-5 py-3 text-sm text-on-surface-variant">{entry.role || '—'}</td>
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

        {!loading && !error && (
          <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-on-surface-variant">
              Showing {filteredEntries.length === 0 ? 0 : Math.min(filteredEntries.length, (currentPage - 1) * PAGE_SIZE + 1)}
              {' - '}
              {Math.min(filteredEntries.length, currentPage * PAGE_SIZE)} of {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-variant sm:px-4 sm:text-sm"
              >
                Prev
              </button>
              <span className="text-xs text-on-surface-variant">Page {currentPage} of {pageCount}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={currentPage === pageCount}
                className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-variant sm:px-4 sm:text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}