import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Field,
  Form,
  Modal,
  PageHeading,
  Table,
  Skeleton,
  ErrorState,
} from '../../components/ui'
import { useList, useSave } from '../../lib/queries'
import { apiClient, list } from '../../lib/apiClient'
import { formatRWF } from '../../lib/currency'
import { dateTime } from '../../lib/period'
import type { Product } from '../products/types'

export type TransactionItem = {
  id: string
  product_name: string
  quantity: number
  selling_price_per_item: number
  line_total: number
  packs: number
  units_per_pack: number
  total_items: number
  price_per_pack: number
  price_per_item: number
  total_cost: number
}

export type Transaction = {
  id: string
  purchase_date?: string
  sale_date?: string
  supplier_name?: string
  payment_method?: string
  total_amount: number
  notes: string
  items: TransactionItem[] | null
}

const paymentLabels: Record<string, string> = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  bank: 'Bank',
}

export function TransactionDetail({
  resource,
  id,
  onClose,
}: {
  resource: 'sales' | 'purchases'
  id: string
  onClose: () => void
}) {
  const query = useQuery({
    queryKey: [resource, id],
    queryFn: () => apiClient<Transaction>(`/${resource}/${id}`),
  })
  const sale = resource === 'sales'
  const data = query.data

  return (
    <Modal title={sale ? 'Sale Receipt' : 'Purchase Details'} onClose={onClose}>
      {query.isPending ? (
        <Skeleton />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        data && (
          <div className="space-y-5">
            <p>{dateTime(data.sale_date ?? data.purchase_date)}</p>
            <p>
              {sale
                ? `Payment: ${paymentLabels[data.payment_method ?? ''] ?? data.payment_method}`
                : `Supplier: ${data.supplier_name}`}
            </p>
            <Table
              rows={data.items ?? []}
              rowKey={(r) => r.id}
              columns={
                sale
                  ? [
                      { label: 'Product', render: (r) => r.product_name },
                      { label: 'Quantity', render: (r) => r.quantity },
                      {
                        label: 'Price per Item',
                        render: (r) => formatRWF(r.selling_price_per_item),
                      },
                      {
                        label: 'Line Total',
                        render: (r) => formatRWF(r.line_total),
                      },
                    ]
                  : [
                      {
                        label: 'Product',
                        render: (r) => (
                          <>
                            {r.product_name}
                            <small className="block">
                              {r.units_per_pack} items per pack ·{' '}
                              {r.total_items} total items
                            </small>
                          </>
                        ),
                      },
                      { label: 'Packs', render: (r) => r.packs },
                      {
                        label: 'Price per Pack',
                        render: (r) => (
                          <>
                            {formatRWF(r.price_per_pack)}
                            <small className="block">
                              {formatRWF(r.price_per_item)} per item
                            </small>
                          </>
                        ),
                      },
                      {
                        label: 'Line Total',
                        render: (r) => formatRWF(r.total_cost),
                      },
                    ]
              }
            />
            <p className="total">Grand Total: {formatRWF(data.total_amount)}</p>
            {data.notes && <p>Notes: {data.notes}</p>}
          </div>
        )
      )}
    </Modal>
  )
}

type Line = { key: string; product_id: string; count: number; price: number }

const newLine = (): Line => ({
  key: crypto.randomUUID(),
  product_id: '',
  count: 1,
  price: 0,
})

function TransactionForm({
  resource,
  onClose,
  onSaved,
}: {
  resource: 'sales' | 'purchases'
  onClose: () => void
  onSaved: (t: Transaction) => void
}) {
  const sale = resource === 'sales'
  const products = useList<Product>('products')
  const suppliers = useList<{ id: string; name: string }>('suppliers')
  const [lines, setLines] = useState<Line[]>([newLine()])
  const [validation, setValidation] = useState<Error | null>(null)
  const save = useSave<Transaction>(resource, onSaved)

  function update(key: string, value: Partial<Line>) {
    setLines((old) =>
      old.map((line) => (line.key === key ? { ...line, ...value } : line)),
    )
    setValidation(null)
  }

  return (
    <Modal
      title={sale ? 'Record Sale' : 'Record Purchase'}
      onClose={() => !save.isPending && onClose()}
    >
      {products.isPending || (!sale && suppliers.isPending) ? (
        <Skeleton />
      ) : products.error || (!sale && suppliers.error) ? (
        <ErrorState
          error={products.error ?? suppliers.error}
          retry={() => {
            void products.refetch()
            void suppliers.refetch()
          }}
        />
      ) : (
        <Form
          pending={save.isPending}
          error={validation ?? save.error}
          label={sale ? 'Record Sale' : 'Record Purchase'}
          onSubmit={(data) => {
            if (sale)
              for (const line of lines) {
                const product = products.data?.find(
                  (p) => p.id === line.product_id,
                )
                const quantity = lines
                  .filter((l) => l.product_id === line.product_id)
                  .reduce((sum, l) => sum + l.count, 0)
                if (!product || quantity > product.current_stock) {
                  setValidation(
                    new Error(
                      `Only ${product?.current_stock ?? 0} items of ${product?.name ?? 'this product'} are available.`,
                    ),
                  )
                  return
                }
              }
            save.mutate({
              body: {
                ...Object.fromEntries(data),
                items: lines.map((line) =>
                  sale
                    ? {
                        product_id: line.product_id,
                        quantity: line.count,
                        selling_price: line.price,
                      }
                    : {
                        product_id: line.product_id,
                        packs: line.count,
                        price_per_pack: line.price,
                      },
                ),
              },
            })
          }}
        >
          {sale ? (
            <Field label="Payment Method">
              <select name="payment_method">
                {Object.entries(paymentLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Supplier">
              <select name="supplier_id" required>
                <option value="">Choose supplier</option>
                {suppliers.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {lines.map((line, index) => {
            const product = products.data?.find((p) => p.id === line.product_id)
            return (
              <section className="line-item space-y-3" key={line.key}>
                <div className="page-heading">
                  <h3>
                    {sale ? 'Item' : 'Product'} {index + 1}
                  </h3>
                  {lines.length > 1 && (
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() =>
                        setLines((old) => old.filter((l) => l.key !== line.key))
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Field label="Product">
                  <select
                    required
                    value={line.product_id}
                    onChange={(e) => {
                      const p = products.data?.find(
                        (p) => p.id === e.target.value,
                      )
                      update(line.key, {
                        product_id: e.target.value,
                        price: sale ? (p?.selling_price ?? 0) : line.price,
                      })
                    }}
                  >
                    <option value="">Choose product</option>
                    {products.data
                      ?.filter(
                        (p) => p.is_active && (!sale || p.current_stock > 0),
                      )
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {sale ? ` (${p.current_stock} available)` : ''}
                        </option>
                      ))}
                  </select>
                </Field>
                <div className="form-grid">
                  <Field label={sale ? 'Quantity' : 'Number of Packs'}>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      max={sale ? product?.current_stock : undefined}
                      value={line.count || ''}
                      onChange={(e) =>
                        update(line.key, { count: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field
                    label={sale ? 'Selling Price per Item' : 'Price per Pack'}
                  >
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={line.price || ''}
                      onChange={(e) =>
                        update(line.key, { price: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>
                {!sale && product && (
                  <p className="muted">
                    {product.units_per_pack} items per pack ·{' '}
                    {product.units_per_pack * line.count} total items ·{' '}
                    {formatRWF(line.price / product.units_per_pack)} per item
                  </p>
                )}
                <p>Line Total: {formatRWF(line.count * line.price)}</p>
              </section>
            )
          })}
          <button
            className="btn secondary"
            type="button"
            onClick={() => setLines((old) => [...old, newLine()])}
          >
            + Add Another {sale ? 'Item' : 'Product'}
          </button>
          <Field label="Notes (optional)">
            <textarea name="notes" />
          </Field>
          <p className="total">
            Total:{' '}
            {formatRWF(lines.reduce((sum, l) => sum + l.count * l.price, 0))}
          </p>
        </Form>
      )}
    </Modal>
  )
}

export function TransactionsPage({
  resource,
}: {
  resource: 'sales' | 'purchases'
}) {
  const sale = resource === 'sales'
  const [page, setPage] = useState(0)
  const [create, setCreate] = useState(false)
  const [view, setView] = useState<string | null>(null)
  const query = useQuery({
    queryKey: [resource, 'list', page],
    queryFn: () =>
      list<Transaction>(`/${resource}?limit=15&offset=${page * 15}`),
  })

  return (
    <div className="space-y-6">
      <PageHeading
        title={sale ? 'Sales' : 'Purchases'}
        action={
          <button className="btn" onClick={() => setCreate(true)}>
            Record {sale ? 'Sale' : 'Purchase'}
          </button>
        }
      />
      <p className="muted">{sale ? 'What did I sell?' : 'What did I buy?'}</p>
      {query.isPending ? (
        <Skeleton />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        <>
          <Table
            rows={query.data}
            rowKey={(r) => r.id}
            empty={`No ${resource} recorded yet.`}
            columns={[
              {
                label: 'Date',
                render: (r) => dateTime(r.sale_date ?? r.purchase_date),
              },
              {
                label: 'Products',
                render: (r: Transaction) =>
                  r.items && r.items.length > 0 ? (
                    r.items.map((i) => i.product_name).join(', ')
                  ) : (
                    <button
                      className="text-link"
                      onClick={() => setView(r.id)}
                    >
                      View items
                    </button>
                  ),
              },
              ...(sale
                ? [
                    {
                      label: 'Payment',
                      render: (r: Transaction) =>
                        paymentLabels[r.payment_method ?? ''] ??
                        r.payment_method,
                    },
                  ]
                : [
                    {
                      label: 'Supplier',
                      render: (r: Transaction) => r.supplier_name,
                    },
                  ]),
              {
                label: sale ? 'Items Sold' : 'Items Received',
                render: (r) =>
                  r.items ? (
                    r.items.reduce(
                      (sum, i) => sum + (sale ? i.quantity : i.total_items),
                      0,
                    )
                  ) : (
                    '—'
                  ),
              },
              { label: 'Total', render: (r) => formatRWF(r.total_amount) },
              {
                label: 'Actions',
                render: (r) => (
                  <button className="text-link" onClick={() => setView(r.id)}>
                    View
                  </button>
                ),
              },
            ]}
          />
          <div className="pagination">
            <button
              className="btn secondary"
              disabled={!page}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              className="btn secondary"
              disabled={query.data.length < 15}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
      {create && (
        <TransactionForm
          resource={resource}
          onClose={() => setCreate(false)}
          onSaved={(t) => {
            setCreate(false)
            setView(t.id)
          }}
        />
      )}
      {view && (
        <TransactionDetail
          resource={resource}
          id={view}
          onClose={() => setView(null)}
        />
      )}
    </div>
  )
}