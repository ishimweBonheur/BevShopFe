export type Summary = {
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
