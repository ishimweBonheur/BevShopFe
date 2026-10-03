import type { LucideIcon } from 'lucide-react'

interface SummaryCardProps {
  title: string
  value: string
  icon: LucideIcon
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate'
  valueClassName?: string
  className?: string
  onClick?: () => void
}

const toneStyles: Record<NonNullable<SummaryCardProps['tone']>, string> = {
  blue: 'bg-info/10 text-info',
  green: 'bg-success/10 text-success',
  amber: 'bg-warning/10 text-warning',
  red: 'bg-danger/10 text-danger',
  slate: 'bg-canvas text-muted',
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  tone = 'slate',
  className = '',
  valueClassName = 'text-ink',
  onClick,
}: SummaryCardProps) {
  const cardClasses = `rounded-2xl border border-line bg-surface p-4 shadow-sm ${className}`

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cardClasses} text-left`}
        aria-label={`${title}: ${value}`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted">{title}</p>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles[tone]}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <p className={`mt-5 text-2xl font-semibold tracking-tight ${valueClassName}`}>
          {value}
        </p>
      </button>
    )
  }

  return (
    <div className={cardClasses} aria-label={`${title}: ${value}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{title}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles[tone]}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <p className={`mt-5 text-2xl font-semibold tracking-tight ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}
