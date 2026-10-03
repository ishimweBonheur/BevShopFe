import { apiClient, list } from '../../lib/apiClient'
import { dateQuery, today } from '../../lib/period'
import type { Summary, HistoryItem } from '../reports/types'
import type { DashboardResponse } from './types'
export async function fetchDashboard(): Promise<DashboardResponse> {
  const params = dateQuery(today(), today())
  const [summary, history] = await Promise.all([
    apiClient<Summary>('/reports/summary?period=today'),
    list<HistoryItem>(`/history?${params}&limit=10`),
  ])
  const events = history
  return {
    today_sales: summary.sales_revenue,
    today_purchases: summary.purchases,
    today_expenses: summary.expenses,
    today_profit_loss: summary.profit_loss,
    today_damaged_loss: summary.damaged_loss,
    items_sold: summary.items_sold,
    current_stock: summary.current_stock,
    low_stock_count: summary.low_stock_count,
    damaged_today: summary.damaged_items,
    recent_activity: events
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
      .map((r) => ({
        ...r,
        type: r.type === 'damage' ? 'damaged' : r.type,
        label: '',
        quantity: r.quantity ?? null,
      })),
  }
}
