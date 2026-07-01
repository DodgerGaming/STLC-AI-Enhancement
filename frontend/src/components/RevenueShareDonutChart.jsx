import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// Shared animation timing so all dashboard charts (bar, donut) animate
// together, in sync, with the same smooth easing curve.
const CHART_ANIMATION_BEGIN = 0
const CHART_ANIMATION_DURATION = 1400
const CHART_ANIMATION_EASING = 'ease-in-out'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { type, value } = payload[0].payload
  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs shadow-popover">
      <p className="font-semibold text-on-surface">{type}</p>
      <p className="text-on-surface-variant">{value}% of revenue</p>
    </div>
  )
}

function ChartLabels({ data }) {
  const items = Array.isArray(data) ? data : []
  if (items.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-on-surface-variant">
      {items.map((entry) => (
        <span key={entry.type} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.type} ({entry.value}%)
        </span>
      ))}
    </div>
  )
}

// Placeholder donut shown while data is loading. Instead of a static skeleton,
// the ring itself sweeps shut and back open (like a shutter/clock-hand closing)
// so the chart area visibly moves instead of sitting frozen.
function LoadingDonut() {
  return (
    <div className="flex h-52 items-center justify-center sm:h-60">
      <div className="relative h-40 w-40">
        <div className="donut-closing-ring absolute inset-0 rounded-full" />
        <div className="absolute inset-[22%] rounded-full bg-surface" />
      </div>
      <style>{`
        @keyframes donut-close-sweep {
          0% {
            background-image: conic-gradient(#C76B6B 0deg, #E8D9D9 0deg);
          }
          50% {
            background-image: conic-gradient(#C76B6B 360deg, #E8D9D9 360deg);
          }
          100% {
            background-image: conic-gradient(#C76B6B 0deg, #E8D9D9 0deg);
          }
        }
        .donut-closing-ring {
          animation: donut-close-sweep 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default function RevenueShareDonutChart({ data, loading = false }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-card sm:p-5">
      <h3 className="text-sm font-bold text-on-surface">Revenue Share by Leather Type</h3>
      <p className="text-xs text-on-surface-variant">Percentage of total revenue per leather type</p>

      {loading ? (
        <LoadingDonut />
      ) : (
        <div className="mt-2 h-52 sm:h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="type"
                innerRadius={44}
                outerRadius={72}
                paddingAngle={2}
                stroke="none"
                isAnimationActive
                animationBegin={CHART_ANIMATION_BEGIN}
                animationDuration={CHART_ANIMATION_DURATION}
                animationEasing={CHART_ANIMATION_EASING}
              >
                {data.map((entry) => (
                  <Cell key={entry.type} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && <ChartLabels data={data} />}
    </div>
  )
}