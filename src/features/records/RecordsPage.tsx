import { useState } from 'react'
import {
  Field,
  Form,
  Modal,
  PageHeading,
  Table,
  Skeleton,
  ErrorState,
  type Column,
} from '../../components/ui'
import { useList, useSave } from '../../lib/queries'
import { formatRWF } from '../../lib/currency'
import type { Product } from '../products/types'
import { dateTime } from '../../lib/period'
export type RecordRow = {
  id: string
  name?: string
  description?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  category?: string
  amount?: number
  expense_date?: string
  damaged_date?: string
  entry_date?: string
  product_name?: string
  product_id?: string
  quantity?: number
  reason?: string
  total_loss?: number
  type?: string
}
const configs = {
  categories: {
    title: 'Categories',
    action: 'Add Category',
    singular: 'Category',
    fields: ['name', 'description'],
    edit: true,
    remove: true,
  },
  suppliers: {
    title: 'Suppliers',
    action: 'Add Supplier',
    singular: 'Supplier',
    fields: ['name', 'phone', 'email', 'address', 'notes'],
    edit: true,
    remove: true,
  },
  expenses: {
    title: 'Expenses',
    action: 'Add Expense',
    singular: 'Expense',
    fields: ['name', 'category', 'amount', 'description'],
    edit: true,
    remove: false,
  },
  'damaged-items': {
    title: 'Damaged Items',
    action: 'Record Damaged Item',
    singular: 'Damaged Item',
    fields: ['product_id', 'quantity', 'reason'],
    edit: false,
    remove: false,
  },
  'owner-money': {
    title: 'Owner Money',
    action: 'Record Owner Money',
    singular: 'Owner Money',
    fields: ['type', 'amount', 'notes'],
    edit: false,
    remove: false,
  },
}
const labels: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
  notes: 'Notes',
  category: 'Category',
  amount: 'Amount',
  product_id: 'Product',
  quantity: 'Quantity',
  reason: 'Reason',
  type: 'Type',
}
export function RecordsPage({ resource }: { resource: keyof typeof configs }) {
  const config = configs[resource]
  const query = useList<RecordRow>(resource)
  const products = useList<Product>('products')
  const [edit, setEdit] = useState<RecordRow | 'new' | null>(null)
  const [remove, setRemove] = useState<RecordRow | null>(null)
  const [productId, setProductId] = useState('')
  const save = useSave<RecordRow>(resource, () => {
    setEdit(null)
    setRemove(null)
  })
  const item = edit && edit !== 'new' ? edit : undefined
  const columns: Column<RecordRow>[] =
    resource === 'categories'
      ? [
          { label: 'Category', render: (r) => r.name },
          {
            label: 'Products',
            render: (r) =>
              products.error
                ? 'Unavailable'
                : products.isPending
                  ? '…'
                  : products.data.filter((p) => p.category_id === r.id).length,
          },
        ]
      : resource === 'suppliers'
        ? ['name', 'phone', 'email', 'address'].map((k) => ({
            label: k === 'name' ? 'Supplier' : labels[k],
            render: (r: RecordRow) => r[k as keyof RecordRow] || '—',
          }))
        : resource === 'expenses'
          ? [
              { label: 'Date', render: (r) => dateTime(r.expense_date) },
              { label: 'Expense', render: (r) => r.name },
              { label: 'Category', render: (r) => r.category },
              { label: 'Amount', render: (r) => formatRWF(r.amount ?? 0) },
              { label: 'Details', render: (r) => r.description || '—' },
            ]
          : resource === 'damaged-items'
            ? [
                { label: 'Date', render: (r) => dateTime(r.damaged_date) },
                { label: 'Product', render: (r) => r.product_name },
                { label: 'Quantity', render: (r) => r.quantity },
                { label: 'Reason', render: (r) => r.reason },
                { label: 'Loss', render: (r) => formatRWF(r.total_loss ?? 0) },
              ]
            : [
                { label: 'Date', render: (r) => dateTime(r.entry_date) },
                {
                  label: 'Type',
                  render: (r) =>
                    r.type === 'money_added' ? 'Money Added' : 'Money Taken',
                },
                { label: 'Amount', render: (r) => formatRWF(r.amount ?? 0) },
                { label: 'Notes', render: (r) => r.notes || '—' },
              ]
  if (config.edit || config.remove)
    columns.push({
      label: 'Actions',
      render: (r) => (
        <div className="actions">
          {config.edit && (
            <button
              onClick={() => {
                save.reset()
                setEdit(r)
              }}
            >
              Edit
            </button>
          )}
          {config.remove && (
            <button
              onClick={() => {
                save.reset()
                setRemove(r)
              }}
            >
              Delete
            </button>
          )}
        </div>
      ),
    })
  return (
    <div className="space-y-6">
      <PageHeading
        title={config.title}
        action={
          <button
            className="btn"
            onClick={() => {
              save.reset()
              setProductId('')
              setEdit('new')
            }}
          >
            {config.action}
          </button>
        }
      />
      {query.isPending ? (
        <Skeleton />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        <Table
          rows={query.data}
          columns={columns}
          rowKey={(r) => r.id}
          empty={`No ${config.title.toLowerCase()} recorded yet.`}
        />
      )}
      {edit && (
        <Modal
          title={item ? `Edit ${config.singular}` : config.action}
          onClose={() => !save.isPending && setEdit(null)}
        >
          {resource === 'damaged-items' && products.isPending ? (
            <Skeleton />
          ) : resource === 'damaged-items' && products.error ? (
            <ErrorState
              error={products.error}
              retry={() => products.refetch()}
            />
          ) : (
            <Form
              pending={save.isPending}
              error={save.error}
              onSubmit={(data) => {
                const body = Object.fromEntries(data) as Record<string, unknown>
                for (const key of ['amount', 'quantity'])
                  if (key in body) body[key] = Number(body[key])
                save.mutate({
                  path: item ? `/${resource}/${item.id}` : `/${resource}`,
                  method: item ? 'PUT' : 'POST',
                  body,
                })
              }}
            >
              {config.fields.map((key) => (
                <Field key={key} label={labels[key]}>
                  {key === 'product_id' ? (
                    <select
                      name={key}
                      required
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                    >
                      <option value="">Choose product</option>
                      {products.data
                        ?.filter((p) => p.is_active && p.current_stock > 0)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.current_stock} available)
                          </option>
                        ))}
                    </select>
                  ) : key === 'type' ? (
                    <select name={key}>
                      <option value="money_added">Money Added</option>
                      <option value="money_taken">Money Taken</option>
                    </select>
                  ) : ['description', 'notes', 'reason'].includes(key) ? (
                    <textarea
                      name={key}
                      defaultValue={String(
                        item?.[key as keyof RecordRow] ?? '',
                      )}
                      required={key === 'reason'}
                    />
                  ) : (
                    <input
                      name={key}
                      type={
                        ['quantity', 'amount'].includes(key)
                          ? 'number'
                          : key === 'email'
                            ? 'email'
                            : key === 'phone'
                              ? 'tel'
                              : 'text'
                      }
                      required={[
                        'name',
                        'quantity',
                        'amount',
                        'category',
                      ].includes(key)}
                      min={
                        key === 'quantity'
                          ? 1
                          : key === 'amount'
                            ? 0.01
                            : undefined
                      }
                      max={
                        key === 'quantity'
                          ? products.data?.find((p) => p.id === productId)
                              ?.current_stock
                          : undefined
                      }
                      step={
                        key === 'quantity'
                          ? 1
                          : key === 'amount'
                            ? '0.01'
                            : undefined
                      }
                      defaultValue={String(
                        item?.[key as keyof RecordRow] ?? '',
                      )}
                    />
                  )}
                </Field>
              ))}
            </Form>
          )}
        </Modal>
      )}
      {remove && (
        <Modal
          title={`Delete ${config.singular}`}
          onClose={() => !save.isPending && setRemove(null)}
        >
          <p>Delete {remove.name}? This cannot be undone.</p>
          <Form
            pending={save.isPending}
            error={save.error}
            label="Delete"
            onSubmit={() =>
              save.mutate({
                path: `/${resource}/${remove.id}`,
                method: 'DELETE',
              })
            }
          >
            <span />
          </Form>
        </Modal>
      )}
    </div>
  )
}
