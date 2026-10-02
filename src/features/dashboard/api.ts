import { apiClient, list } from '../../lib/apiClient'
import { dateQuery, today } from '../../lib/period'
import type { Summary, HistoryItem } from '../reports/types'
import type { RecordRow } from '../records/RecordsPage'
import type { DashboardResponse } from './types'
export async function fetchDashboard(): Promise<DashboardResponse> {
  const params = dateQuery(today(), today())
  const [summary, history, damaged, owner] = await Promise.all([
    apiClient<Summary>('/reports/summary?period=today'),
    list<HistoryItem>(`/history?${params}&limit=10`),
    list<RecordRow>('/damaged-items'),
    list<RecordRow>('/owner-money'),
  ])
  const start = new Date(params.get('from')!).getTime()
  const end = new Date(params.get('to')!).getTime()
  const isToday = (date: string) =>
    new Date(date).getTime() >= start && new Date(date).getTime() < end
  const events = [
    ...history,
    ...owner
      .filter((r) => isToday(r.entry_date!))
      .map((r) => ({
        id: r.id,
        type: r.type!,
        date: r.entry_date!,
        description: r.notes ?? '',
        amount: r.amount!,
      })),
  ]
  return {
    today_sales: summary.sales_revenue,
    today_purchases: summary.purchases,
    today_expenses: summary.expenses,
    today_profit_loss: summary.profit_loss,
    current_stock: summary.current_stock,
    low_stock_count: summary.low_stock_count,
    damaged_today: damaged
      .filter((r) => isToday(r.damaged_date!))
      .reduce((sum, r) => sum + (r.quantity ?? 0), 0),
    recent_activity: events
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
      .map((r) => ({
        ...r,
        type: r.type === 'damage' ? 'damaged' : r.type,
        label: '',
        quantity: null,
      })),
  }
}
