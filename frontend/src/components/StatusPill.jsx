const STATUS_STYLES = {
  Available: 'bg-success/10 text-success',
  Completed: 'bg-success/10 text-success',
  Reserved: 'bg-warning/10 text-warning',
  Pending: 'bg-warning/10 text-warning',
  Processing: 'bg-warning/10 text-warning',
  Depleted: 'bg-error/10 text-error',
}

export default function StatusPill({ status }) {
  const className = STATUS_STYLES[status] || 'bg-surface-variant text-on-surface-variant'

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        className,
      ].join(' ')}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
