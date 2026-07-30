import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '../utils/format.js'

// Shared animation timing so all dashboard charts (bar, donut) animate
// together, in sync, with the same smooth easing curve.
const CHART_ANIMATION_BEGIN = 0
const CHART_ANIMATION_DURATION = 1400
const CHART_ANIMATION_EASING = 'ease-in-out'

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

function CustomLegend() {
  return (
    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#8B2525]" />
      <span>Quantity sold per leather type</span>
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
              tick={{ fontSize: 11, fill: '#504443' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12, fill: '#504443' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,37,37,0.06)' }} />
            <Bar
              dataKey="qty"
              fill="#8B2525"
              radius={[6, 6, 0, 0]}
              maxBarSize={64}
              isAnimationActive
              animationBegin={CHART_ANIMATION_BEGIN}
              animationDuration={CHART_ANIMATION_DURATION}
              animationEasing={CHART_ANIMATION_EASING}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <CustomLegend />
    </div>
  )
}