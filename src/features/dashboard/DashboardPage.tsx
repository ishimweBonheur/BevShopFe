import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Package,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { formatRWF } from '../../lib/currency'
import { formatDashboardDate } from '../../lib/date'
import { fetchDashboard } from './api'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { LowStockCard } from './components/LowStockCard'
import { RecentActivity } from './components/RecentActivity'
import { SummaryCard } from './components/SummaryCard'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted">
              Here is how your shop is doing today.
            </p>
          </div>
          <p className="text-sm font-medium text-muted">
            {formatDashboardDate(new Date())}
          </p>
        </header>

        <DashboardSkeleton />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center shadow-sm">
        <p className="text-lg font-medium text-ink">
          We couldn't load today's shop information.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-hover"
        >
          Try Again
        </button>
      </div>
    )
  }

  const profitIsPositive = data.today_profit_loss >= 0
  const profitTitle = profitIsPositive ? "Today's Profit" : "Today's Loss"
  const profitValue = profitIsPositive
    ? formatRWF(data.today_profit_loss)
    : formatRWF(Math.abs(data.today_profit_loss))

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here is how your shop is doing today.
          </p>
        </div>
        <p className="text-sm font-medium text-muted">
          {formatDashboardDate(new Date())}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Today's Sales"
          value={formatRWF(data.today_sales)}
          icon={ShoppingCart}
          tone="blue"
        />
        <SummaryCard
          title="Today's Purchases"
          value={formatRWF(data.today_purchases)}
          icon={Package}
          tone="amber"
        />
        <SummaryCard
          title="Today's Expenses"
          value={formatRWF(data.today_expenses)}
          icon={Wallet}
          tone="slate"
        />
        <SummaryCard
          title={profitTitle}
          value={data.today_profit_loss === 0 ? 'RWF 0' : profitValue}
          icon={profitIsPositive ? ArrowUpCircle : ArrowDownCircle}
          tone={profitIsPositive ? 'green' : 'red'}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Items in Stock"
          value={data.current_stock.toLocaleString()}
          icon={Boxes}
          tone="slate"
        />
        <LowStockCard
          count={data.low_stock_count}
          onClick={() => navigate('/products?status=low-stock')}
        />
        <SummaryCard
          title="Damaged Today"
          value={`${data.damaged_today} ${data.damaged_today === 1 ? 'Item' : 'Items'}`}
          icon={AlertTriangle}
          tone="amber"
          className="cursor-pointer transition hover:border-warning/30 hover:bg-warning/10"
          onClick={() => navigate('/damaged-items')}
        />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Quick Actions</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className="flex items-center gap-3 rounded-xl border border-primary bg-primary px-4 py-3 text-left text-sm font-medium text-on-primary transition hover:bg-primary-hover"
            aria-label="Record a sale"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Record Sale
          </button>
          <button
            type="button"
            onClick={() => navigate('/purchases')}
            className="flex items-center gap-3 rounded-xl border border-primary bg-primary px-4 py-3 text-left text-sm font-medium text-on-primary transition hover:bg-primary-hover"
            aria-label="Record a purchase"
          >
            <Package className="h-4 w-4" aria-hidden="true" />
            Record Purchase
          </button>
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-3 rounded-xl border border-primary bg-primary px-4 py-3 text-left text-sm font-medium text-on-primary transition hover:bg-primary-hover"
            aria-label="Add an expense"
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Add Expense
          </button>
          <button
            type="button"
            onClick={() => navigate('/damaged-items')}
            className="flex items-center gap-3 rounded-xl border border-primary bg-primary px-4 py-3 text-left text-sm font-medium text-on-primary transition hover:bg-primary-hover"
            aria-label="Record a damaged item"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Record Damaged Item
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-ink">Recent Activity</h2>
        </div>

        <RecentActivity activities={data.recent_activity.slice(0, 10)} />
      </section>
    </div>
  )
}
