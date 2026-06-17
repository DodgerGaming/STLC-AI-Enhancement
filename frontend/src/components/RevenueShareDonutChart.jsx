import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

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

export default function RevenueShareDonutChart({ data }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-card sm:p-5">
      <h3 className="text-sm font-bold text-on-surface">Revenue Share by Leather Type</h3>
      <p className="text-xs text-on-surface-variant">Percentage of total revenue per leather type</p>

      <div className="mt-2 h-40 sm:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="type"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.type} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 space-y-2">
        {data.map((entry) => (
          <li key={entry.type} className="flex items-center justify-between text-xs sm:text-sm">
            <span className="flex items-center gap-2 text-on-surface-variant">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.type}
            </span>
            <span className="font-semibold text-on-surface">{entry.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
