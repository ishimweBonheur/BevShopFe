export type Summary = {
  cost_of_items_sold: number
  items_purchased: number
  damaged_items: number
  out_of_stock_count: number
  cash: number
  mobile_money: number
  bank: number
  sales_revenue: number
  purchases: number
  expenses: number
  profit_loss: number
  damaged_loss: number
  items_sold: number
  current_stock: number
  low_stock_count: number
}
export type Report = {
  summary: Summary
  inventory_value: number
  profit_margin: number
  top_products:
    | {
        product_id: string
        product_name: string
        quantity: number
        revenue: number
      }[]
    | null
}
export type HistoryItem = {
  id: string
  type: string
  date: string
  description: string
  amount: number
  category?: string
  quantity?: number | null
  details?: string
  reference_id?: string
}
export const historyLabels: Record<string, string> = {
  purchase: 'Bought',
  sale: 'Sold',
  expense: 'Expense',
  damage: 'Damaged',
  money_added: 'Money Added',
  money_taken: 'Money Taken',
}

export type PrintableReport = {
 title: string
 period: { from: string; to: string }
 generated_at: string
 summary: Summary
 history: HistoryItem[]
 monthly: { month: string; summary: Summary }[]
}
