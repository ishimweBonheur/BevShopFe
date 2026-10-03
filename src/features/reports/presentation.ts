import { formatRWF } from '../../lib/currency'
import type { PrintableReport, Summary } from './types'

const dateFormat = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kigali', ...options }).format(new Date(value))
export function resultLabel(value: number) {
  return value > 0 ? 'Profit' : value < 0 ? 'Loss' : 'No Profit / Loss'
}
export function resultClass(value: number) {
  return value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-ink'
}
export function summaryRows(s: Summary): [string, string][] {
  return [
    ['Total Sales', formatRWF(s.sales_revenue)],
    ['Total Purchases', formatRWF(s.purchases)],
    ['Cost of Items Sold', formatRWF(s.cost_of_items_sold)],
    ['Expenses', formatRWF(s.expenses)],
    ['Damaged Items Loss', formatRWF(s.damaged_loss)],
    [resultLabel(s.profit_loss), formatRWF(Math.abs(s.profit_loss))],
  ]
}
export function stockRows(s: Summary): [string, string][] {
  return [
    ['Items Purchased', String(s.items_purchased)], ['Items Sold', String(s.items_sold)],
    ['Damaged Items', String(s.damaged_items)], ['Current Stock', String(s.current_stock)],
    ['Low Stock Products', String(s.low_stock_count)], ['Out of Stock Products', String(s.out_of_stock_count)],
  ]
}
export function paymentRows(s: Summary): [string, string][] {
  return [['Cash', formatRWF(s.cash)], ['Mobile Money', formatRWF(s.mobile_money)], ['Bank', formatRWF(s.bank)], ['Total', formatRWF(s.sales_revenue)]]
}
export function reportPeriod(report: PrintableReport, period: string) {
  const from = report.period.from
  const end = new Date(new Date(report.period.to).getTime() - 1).toISOString()
  const date = (v: string) => dateFormat(v, { day: '2-digit', month: 'long', year: 'numeric' })
  if (period === 'today') return date(from)
  if (period === 'month') return dateFormat(from, { month: 'long', year: 'numeric' })
  if (period === 'year') return dateFormat(from, { year: 'numeric' })
  return `${date(from)} to ${date(end)}`
}
export function reportFilename(report: PrintableReport, period: string) {
  const day = (v: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(v))
  const from = day(report.period.from)
  const end = day(new Date(new Date(report.period.to).getTime() - 1).toISOString())
  const suffix = period === 'today' ? from : period === 'year' ? from.slice(0, 4) : period === 'month' ? dateFormat(report.period.from, { month: 'long', year: 'numeric' }).toLowerCase().replace(' ', '-') : `${from}-to-${end}`
  return `business-report-${suffix}.pdf`
}
