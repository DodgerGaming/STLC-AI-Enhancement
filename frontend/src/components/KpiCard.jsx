import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

/**
 * @param {{
 *  label: string,
 *  value: string,
 *  subtitle: string,
 *  icon: React.ComponentType,
 *  trend?: { direction: 'up' | 'down', value: string },
 *  tone?: 'default' | 'danger'
 * }} props
 */
export default function KpiCard({ label, value, subtitle, icon: Icon, trend, tone = 'default' }) {
  const isDanger = tone === 'danger'

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-on-surface-variant">{label}</p>
        {Icon && (
          <div
            className={[
              'flex h-9 w-9 items-center justify-center rounded-lg',
              isDanger ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary',
            ].join(' ')}
          >
            <Icon size={18} strokeWidth={2.2} />
          </div>
        )}
      </div>

      <p
        className={[
          'mt-3 text-[28px] font-extrabold leading-tight tracking-tight',
          isDanger ? 'text-error' : 'text-on-surface',
        ].join(' ')}
      >
        {value}
      </p>

      <div className="mt-1.5 flex items-center gap-1.5">
        {trend && (
          <span
            className={[
              'flex items-center gap-0.5 text-xs font-semibold',
              trend.direction === 'up' ? 'text-success' : 'text-error',
            ].join(' ')}
          >
            {trend.direction === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend.value}
          </span>
        )}
        <p className="text-xs text-on-surface-variant">{subtitle}</p>
      </div>
    </div>
  )
}
