export type DashboardActivityType =
  | 'sale'
  | 'purchase'
  | 'expense'
  | 'damaged'
  | 'money_added'
  | 'money_taken'
  | string

export interface DashboardActivity {
  id: string
  date: string
  type: DashboardActivityType
  label: string
  description: string
  quantity: number | null
  amount: number
}

export interface DashboardResponse {
  today_sales: number
  today_purchases: number
  today_expenses: number
  today_profit_loss: number
  current_stock: number
  low_stock_count: number
  damaged_today: number
  recent_activity: DashboardActivity[]
}

export const ACTIVITY_LABELS: Record<string, string> = {
  sale: 'Sold',
  purchase: 'Bought',
  expense: 'Expense',
  damaged: 'Damaged',
  money_added: 'Money Added',
  money_taken: 'Money Taken',
}

export function getActivityLabel(type: DashboardActivityType): string {
  return ACTIVITY_LABELS[type] ?? 'Update'
}
