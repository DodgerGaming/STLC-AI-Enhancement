import { useEffect, useMemo, useState } from 'react'
import MaterialCard from '../components/MaterialCard.jsx'
import { fetchMaterialsFiltered } from '../data/apiLeather.js'
import { formatPeso } from '../utils/format.js'

const TABS = [
  { label: 'All Materials', value: 'All' },
  { label: 'Cowhide (SQFT)', value: 'Cowhide' },
  { label: 'Goat Skin (SQFT)', value: 'Goat Skin' },
  { label: 'Scrap Leather', value: 'Scrap Leather' },
]

export default function LeatherCatalog() {
  const [materials, setMaterials] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    const type = activeTab === 'All' ? undefined : activeTab
    fetchMaterialsFiltered({ type })
      .then((data) => {
        setMaterials(data)
        setError('')
      })
      .catch((err) => setError(err.message || 'Failed to load materials'))
      .finally(() => setLoading(false))
  }, [activeTab])

  const filtered = useMemo(
    () =>
      (materials || []).filter(
        (material) => Number(material.totalStock ?? material.totalstock ?? material.total_stock ?? 0) > 0
      ),
    [materials]
  )

  const noResultsText = 'No available materials found.'

  return (
    <div className="pb-28">
      <div className="mt-2 flex flex-wrap gap-2">
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