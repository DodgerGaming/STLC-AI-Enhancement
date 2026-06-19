import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import MaterialCard from '../components/MaterialCard.jsx'
import { fetchMaterials, fetchMaterialsFiltered } from '../data/apiLeather.js'
import { formatPeso } from '../utils/format.js'

const TABS = [
  { label: 'All Materials', value: 'All' },
  { label: 'Cowhide (SQFT)', value: 'Cowhide' },
  { label: 'Goat Skin (SQFT)', value: 'Goat Skin' },
  { label: 'Scrap Leather', value: 'Scrap Leather' },
]

export default function LeatherCatalog() {
  const [materials, setMaterials] = useState([])
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // initial load
    setLoading(true)
    fetchMaterials()
      .then((data) => {
        setMaterials(data)
        setError('')
      })
      .catch((err) => setError(err.message || 'Failed to load materials'))
      .finally(() => setLoading(false))
  }, [])

  // server-side search: query the API when query or activeTab changes (debounced)
  useEffect(() => {
    const term = query.trim()
    const timeout = setTimeout(() => {
      setLoading(true)
      fetchMaterialsFiltered({ q: term || undefined, type: activeTab })
        .then((data) => {
          setMaterials(data)
          setError('')
        })
        .catch((err) => setError(err.message || 'Failed to load materials'))
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, activeTab])

  const filtered = useMemo(() => materials || [], [materials])

  const noResultsText = query.trim()
    ? `No materials match "${query}".`
    : 'No materials found.'

  return (
    <div className="pb-28">
      <div>
        <h1 className="text-2xl font-extrabold text-on-surface">Leather Catalog</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Browse and select materials for the current order.
        </p>
      </div>

      <div className="relative mt-5">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search material name or batch code..."
          className="w-full rounded-xl border border-outline-variant bg-surface py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={[
              'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
              activeTab === tab.value
                ? 'bg-primary text-surface'
                : 'bg-surface-variant text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">Loading materials...</div>
        ) : error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-5 py-6 text-sm text-error">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((material) => (
              <MaterialCard key={material.material_id} material={material} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-on-surface-variant">
                {noResultsText}
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  )
}