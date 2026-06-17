import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '../utils/format.js'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { type, qty, unit } = payload[0].payload
  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs shadow-popover">
      <p className="font-semibold text-on-surface">{type}</p>
      <p className="text-on-surface-variant">
        {formatNumber(qty, 0)} {unit} sold
      </p>
    </div>
  )
}

export default function SalesByTypeBarChart({ data }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-card sm:p-5">
      <h3 className="text-sm font-bold text-on-surface">Sales by Leather Type</h3>
      <p className="text-xs text-on-surface-variant">Quantity sold per category</p>

      <div className="mt-4 h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1D8D7" vertical={false} />
            <XAxis
              dataKey="type"
              tick={{ fontSize: 12, fill: '#504443' }}
              axisLine={{ stroke: '#E1D8D7' }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12, fill: '#504443' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,37,37,0.06)' }} />
            <Bar dataKey="qty" fill="#8B2525" radius={[6, 6, 0, 0]} maxBarSize={64} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
