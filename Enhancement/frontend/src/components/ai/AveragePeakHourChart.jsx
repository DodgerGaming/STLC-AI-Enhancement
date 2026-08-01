import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '../../utils/format.js'

// Shared animation timing so all dashboard charts (bar, donut, line) animate
// together, in sync, with the same smooth easing curve.
const CHART_ANIMATION_BEGIN = 0
const CHART_ANIMATION_DURATION = 1400
const CHART_ANIMATION_EASING = 'ease-in-out'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const { qty } = payload[0].payload
  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs shadow-popover">
      <p className="font-semibold text-on-surface">{label}</p>
      <p className="text-on-surface-variant">{formatNumber(qty, 0)} orders</p>
    </div>
  )
}

function CustomLegend() {
  return (
    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
      <span className="inline-block h-0.5 w-3 rounded-full bg-[#8B2525]" />
      <span>Orders placed per hour of day</span>
    </div>
  )
}

// Placeholder shown while data is loading — a thin bar sweeps left to right
// so the chart area visibly moves instead of sitting frozen.
function LoadingLine() {
  return (
    <div className="flex h-48 items-center sm:h-64">
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-outline-variant/50">
        <div className="peak-hour-sweep absolute inset-y-0 w-1/3 rounded-full bg-primary/70" />
      </div>
      <style>{`
        @keyframes peak-hour-sweep-move {
          0% { left: -33%; }
          100% { left: 100%; }
        }
        .peak-hour-sweep {
          animation: peak-hour-sweep-move 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

/**
 * @param {{
 *  data: Array<{ hour: string, qty: number }>,
 *  loading?: boolean
 * }} props
 */
export default function AveragePeakHourChart({ data = [], loading = false }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-card sm:p-5">
      <h3 className="text-sm font-bold text-on-surface">Average Peak Hour</h3>
      <p className="text-xs text-on-surface-variant">Order volume by hour of day</p>

      {loading ? (
        <LoadingLine />
      ) : (
        <div className="mt-4 h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1D8D7" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: '#504443' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12, fill: '#504443' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8B2525', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line
                type="monotone"
                dataKey="qty"
                stroke="#8B2525"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#8B2525', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationBegin={CHART_ANIMATION_BEGIN}
                animationDuration={CHART_ANIMATION_DURATION}
                animationEasing={CHART_ANIMATION_EASING}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <CustomLegend />
    </div>
  )
}