import { useState } from 'react'
import { toast } from 'sonner'
import { summaryRows, stockRows, paymentRows, resultClass, resultLabel, reportPeriod } from './presentation'
import { useQuery } from '@tanstack/react-query'
import { apiClient, list } from '../../lib/apiClient'
import { useList } from '../../lib/queries'
import { dateQuery, dateTime, periodDates, today } from '../../lib/period'
import { formatRWF } from '../../lib/currency'
import {
  ErrorState,
  Field,
  Modal,
  PageHeading,
  Skeleton,
  Table,
} from '../../components/ui'
import type { Product } from '../products/types'
import { TransactionDetail } from '../transactions/TransactionsPage'
import {
  historyLabels,
  type HistoryItem,
  type Report,
  type PrintableReport,
} from './types'
export function ReportsPage() {
  const [period, setPeriod] = useState('today')
  const [generating, setGenerating] = useState(false)
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const dates = period === 'custom' ? [from, to] : periodDates(period)
  const valid = Boolean(dates[0] && dates[1] && dates[0] <= dates[1])
  const params = dateQuery(dates[0], dates[1]).toString()
  const report = useQuery({
    queryKey: ['reports', params],
    queryFn: () => apiClient<Report>(`/reports/dashboard?${params}`),
    enabled: valid,
  })
  const summary = useQuery({
    queryKey: ['reports', 'print', params],
    queryFn: () => apiClient<PrintableReport>(`/reports/print?${params}`),
    enabled: valid,
  })
  const products = useList<Product>('products')
  const s = summary.data?.summary
  async function downloadPDF() {
    if (!summary.data || generating) return
    setGenerating(true)
    try {
      const { downloadReportPDF } = await import('./pdf')
      await downloadReportPDF(summary.data, period)
    } catch {
      toast.error('Could not generate the report PDF. Please try again.')
    } finally { setGenerating(false) }
  }
  return (
    <div className="space-y-6">
      <PageHeading title="Reports" />
      <div className="filters">
        <Field label="Period">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {[
              ['today', 'Today'],
              ['week', 'This Week'],
              ['month', 'This Month'],
              ['year', 'This Year'],
              ['custom', 'Custom Date Range'],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        {period === 'custom' && (
          <>
            <Field label="From Date">
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field label="To Date">
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn" onClick={() => void downloadPDF()} disabled={!valid || !summary.data || summary.isFetching || !!summary.error || generating}>
          {generating ? 'Generating PDF...' : 'Download PDF'}
        </button>
        <span className="muted text-sm">A4 report with the full business history.</span>
      </div>
      {!valid ? (
        <p role="alert">Choose a valid date range.</p>
      ) : report.isPending || summary.isPending ? (
        <Skeleton />
      ) : report.error || summary.error ? (
        <ErrorState
          error={report.error ?? summary.error}
          retry={() => {
            void report.refetch()
            void summary.refetch()
          }}
        />
      ) : (
        s &&
        report.data && (
          <>
            <h2>Business Summary</h2>
            <div className="summary-grid">
              {summaryRows(s).map(([label, value]) => (
                <div className="panel" key={label}>
                  <p className="muted">{label}</p>
                  <p className={`total ${label === resultLabel(s.profit_loss) ? resultClass(s.profit_loss) : ''}`}>{value}</p>
                </div>
              ))}
            </div>
            <p className="muted">{summary.data && reportPeriod(summary.data, period)} ? Generated {dateTime(summary.data?.generated_at)}</p>
            <h2>Stock Summary</h2>
            <div className="summary-grid">{stockRows(s).map(([label, value]) => <div className="panel" key={label}><p className="muted">{label}</p><p className="total">{value}</p></div>)}</div>
            <p className="muted">Stock counts are current. Low stock includes out-of-stock products.</p>
            <h2>Payment Summary</h2>
            <Table rows={paymentRows(s)} rowKey={r => r[0]} columns={[{label: 'Payment Method', render: r => r[0]}, {label: 'Amount', render: r => r[1]}]} />
            {period === 'year' && <><h2>Monthly Summary</h2><Table rows={summary.data?.monthly ?? []} rowKey={r => r.month} columns={[
              {label: 'Month', render: r => r.month}, {label: 'Sales', render: r => formatRWF(r.summary.sales_revenue)},
              {label: 'Expenses', render: r => formatRWF(r.summary.expenses)}, {label: 'Damaged Loss', render: r => formatRWF(r.summary.damaged_loss)},
              {label: 'Profit / Loss', render: r => <span className={resultClass(r.summary.profit_loss)}>{resultLabel(r.summary.profit_loss)}: {formatRWF(Math.abs(r.summary.profit_loss))}</span>},
            ]} /></>}
            <h2>Full Business History</h2>
            <Table rows={summary.data?.history ?? []} rowKey={r => r.type + r.id} empty="No activity in this period." columns={[
              {label: 'Date', render: r => dateTime(r.date)}, {label: 'Type', render: r => historyLabels[r.type] ?? r.type},
              {label: 'Item / Description', render: r => r.description}, {label: 'Category', render: r => r.category || '?'},
              {label: 'Quantity', render: r => r.quantity ?? '?'}, {label: 'Amount', render: r => formatRWF(r.amount)}, {label: 'Details', render: r => r.details || '?'},
            ]} />
            <div className="panel"><h2>FINAL RESULT</h2><p className={`total ${resultClass(s.profit_loss)}`}>{resultLabel(s.profit_loss)}: {formatRWF(Math.abs(s.profit_loss))}</p><p className="muted">Sales ? Cost of Items Sold ? Expenses ? Damaged Loss = Profit / Loss</p></div>
            <h2>Best-Selling Products</h2>
            <Table
              rows={report.data.top_products ?? []}
              rowKey={(r) => r.product_id}
              empty="No sales in this period."
              columns={[
                { label: 'Product', render: (r) => r.product_name },
                { label: 'Items Sold', render: (r) => r.quantity },
                { label: 'Sales', render: (r) => formatRWF(r.revenue) },
              ]}
            />
            <p className="muted">Top five products by sales value.</p>
          </>
        )
      )}
      <h2>Low Stock</h2>
      {products.isPending ? (
        <Skeleton />
      ) : products.error ? (
        <ErrorState error={products.error} retry={() => products.refetch()} />
      ) : (
        <Table
          rows={products.data.filter(
            (p) => p.is_active && p.current_stock <= p.low_stock_level,
          )}
          rowKey={(p) => p.id}
          empty="All active products are above their low-stock alert."
          columns={[
            { label: 'Product', render: (p) => p.name },
            { label: 'In Stock', render: (p) => p.current_stock },
            { label: 'Low Stock Alert', render: (p) => p.low_stock_level },
          ]}
        />
      )}
      <h2>Product Report</h2>
      {products.data && (
        <Table
          rows={products.data}
          rowKey={(p) => p.id}
          columns={[
            { label: 'Product', render: (p) => p.name },
            { label: 'Category', render: (p) => p.category_name },
            { label: 'Current Stock', render: (p) => p.current_stock },
            {
              label: 'Selling Price',
              render: (p) => formatRWF(p.selling_price),
            },
          ]}
        />
      )}
      <p className="muted">Product stock reflects current availability.</p>
    </div>
  )
}
export function HistoryPage() {
  const [from, setFrom] = useState(periodDates('month')[0])
  const [to, setTo] = useState(today())
  const [type, setType] = useState('')
  const [limit, setLimit] = useState(100)
  const [view, setView] = useState<HistoryItem | null>(null)
  const params = dateQuery(from, to)
  params.set('limit', String(limit))
  const valid = Boolean(from && to && from <= to)
  const query = useQuery({
    queryKey: ['history', params.toString()],
    queryFn: () => list<HistoryItem>(`/history?${params}`),
    enabled: valid,
  })
  const rows = [...(query.data ?? [])]
    .filter((r) => !type || r.type === type)
    .sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="space-y-6">
      <PageHeading title="History" />
      <div className="filters">
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            {Object.entries(historyLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From Date">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => {
              setFrom(e.target.value)
              setLimit(100)
            }}
          />
        </Field>
        <Field label="To Date">
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => {
              setTo(e.target.value)
              setLimit(100)
            }}
          />
        </Field>
      </div>
      {!valid ? (
        <p role="alert">Choose a valid date range.</p>
      ) : query.isPending ? (
        <Skeleton />
      ) : query.error ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch()
          }}
        />
      ) : (
        <>
          <Table
            rows={rows}
            rowKey={(r) => `${r.type}-${r.id}`}
            empty="No activity in this date range."
            columns={[
              { label: 'Date', render: (r) => dateTime(r.date) },
              {
                label: 'Type',
                render: (r) => historyLabels[r.type] ?? 'Update',
              },
              {
                label: 'Item / Description',
                render: (r) => r.description || historyLabels[r.type],
              },
              { label: 'Amount', render: (r) => formatRWF(r.amount) },
              {
                label: 'Details',
                render: (r) => (
                  <button className="text-link" onClick={() => setView(r)}>
                    View
                  </button>
                ),
              },
            ]}
          />
          {query.data.length >= limit && (
            <button
              className="btn secondary"
              onClick={() => setLimit((l) => l + 100)}
            >
              Load older activity
            </button>
          )}
        </>
      )}
      {view &&
        (view.type === 'sale' || view.type === 'purchase' ? (
          <TransactionDetail
            resource={view.type === 'sale' ? 'sales' : 'purchases'}
            id={view.reference_id ?? view.id}
            onClose={() => setView(null)}
          />
        ) : (
          <Modal
            title={historyLabels[view.type] ?? 'Activity'}
            onClose={() => setView(null)}
          >
            <p>{dateTime(view.date)}</p>
            <p>{view.description}</p>
            <p className="total">{formatRWF(view.amount)}</p>
          </Modal>
        ))}
    </div>
  )
}
