import { AlertTriangle } from 'lucide-react'

interface LowStockCardProps {
  count: number
  onClick?: () => void
}

export function LowStockCard({ count, onClick }: LowStockCardProps) {
  const cardText = count === 1 ? '1 Product' : `${count} Products`

  const sharedClasses =
    'flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-4 text-left shadow-sm transition hover:border-warning/30 hover:bg-warning/10'

  const content = (
    <>
      <div>
        <p className="text-sm font-medium text-muted">Low Stock</p>
        <p className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          {cardText}
        </p>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={sharedClasses}
        aria-label={`View ${count} low-stock products`}
      >
        {content}
      </button>
    )
  }

  return <div className={sharedClasses}>{content}</div>
}
