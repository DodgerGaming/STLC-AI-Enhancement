import { useNavigate } from 'react-router-dom'
import leatherPlaceholder from '../assets/leather-placeholder.jpg'
import { formatPeso, formatNumber } from '../utils/format.js'
import { SCRAP_UNIT } from '../data/mockLeather.js'

const TAG_STYLES = {
  'Best Seller': 'bg-primary text-surface',
  'Low Stock': 'bg-error text-surface',
  Sale: 'bg-success text-surface',
}

export default function MaterialCard({ material }) {
  const navigate = useNavigate()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/sales/${material.material_id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/sales/${material.material_id}`)}
      className="group cursor-pointer rounded-xl border border-outline-variant bg-surface shadow-card transition-shadow hover:shadow-popover"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
        <img
          src={leatherPlaceholder}
          alt={`${material.material_name} texture`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{ backgroundColor: material.tint, opacity: 0.55 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

        {material.tag && (
          <span
            className={[
              'absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm',
              TAG_STYLES[material.tag] || 'bg-surface text-on-surface',
            ].join(' ')}
          >
            {material.tag}
          </span>
        )}

      </div>

      <div className="px-4 pb-4 pt-5">
        <p className="truncate text-sm font-bold text-on-surface">{material.material_name}</p>
        <p className="mt-0.5 text-sm font-semibold text-primary">
          {formatPeso(material.sale_price)}{' '}
          <span className="text-xs font-medium text-on-surface-variant">/ {material.unit}</span>
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-outline-variant pt-3 text-xs">
          <div>
            <p className="text-on-surface-variant">SKU</p>
            <p className="font-semibold text-on-surface">{material.sku}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">In Stock</p>
            <p className="font-semibold text-on-surface">
              {formatNumber(material.totalStock, material.unit === SCRAP_UNIT ? 1 : 0)} {material.unit}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
