import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react'

/**
 * AIInsightPanel
 *
 * Frontend-only presentational component for the AI Integration feature
 * (Reports / Trend Identification / Suggestions). It does not fetch or
 * generate anything itself — it just renders whatever insight text/props
 * are passed to it. The actual AI logic (backend) plugs in later by
 * passing `insight`, `trend`, and `loading` as props from an API call.
 *
 * @param {{
 *  title?: string,
 *  insight?: string,
 *  trend?: { direction: 'up' | 'down', value: string },
 *  loading?: boolean,
 *  variant?: 'banner' | 'compact'
 * }} props
 */
export default function AIInsightPanel({
  title = 'AI Executive Summary',
  insight,
  trend,
  loading = false,
  variant = 'banner',
}) {
  const isCompact = variant === 'compact'

  return (
    <div
      className={[
        'rounded-xl border border-primary/20 bg-primary/5 shadow-card',
        isCompact ? 'p-3' : 'p-4 sm:p-5',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            'flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
            isCompact ? 'h-7 w-7' : 'h-9 w-9',
          ].join(' ')}
        >
          <Sparkles size={isCompact ? 14 : 18} strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={[
                'font-bold uppercase tracking-wide text-primary',
                isCompact ? 'text-[10px]' : 'text-xs',
              ].join(' ')}
            >
              {title}
            </p>

            {trend && !loading && (
              <span
                className={[
                  'flex items-center gap-0.5 font-semibold',
                  trend.direction === 'up' ? 'text-success' : 'text-error',
                  isCompact ? 'text-[10px]' : 'text-xs',
                ].join(' ')}
              >
                {trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {trend.value}
              </span>
            )}
          </div>

          {loading ? (
            <div className="mt-2 space-y-1.5" role="status" aria-label="Loading AI insight">
              <div className="h-3 w-11/12 animate-pulse rounded-full bg-outline-variant/60" />
              {!isCompact && (
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-outline-variant/60" />
              )}
            </div>
          ) : (
            <p
              className={[
                'mt-1 text-on-surface',
                isCompact ? 'text-xs leading-snug' : 'text-sm leading-relaxed',
              ].join(' ')}
            >
              {insight || 'No AI insight available yet.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}