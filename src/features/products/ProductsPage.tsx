import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { formatRWF } from '../../lib/currency'
import type { Product } from './types'
type Category = { id: string; name: string }
export function ProductsPage() {
  const query = useList<Product>('products')
  const categories = useList<Category>('categories')
  const [params, setParams] = useSearchParams()
  const [edit, setEdit] = useState<Product | 'new' | null>(null)
  const [view, setView] = useState<Product | null>(null)
  const [deactivate, setDeactivate] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const save = useSave<Product>('products', () => {
    setEdit(null)
    setDeactivate(null)
  })
  const rows = (query.data ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (params.get('status') !== 'low-stock' ||
        (p.is_active && p.current_stock <= p.low_stock_level)),
  )
  const item = edit && edit !== 'new' ? edit : undefined
  return (
    <div className="space-y-6">
      <PageHeading
        title="Products"
        action={
          <button
            className="btn"
            onClick={() => {
              save.reset()
              setEdit('new')
            }}
          >
            Add Product
          </button>
        }
      />
      <div className="filters">
        <Field label="Search products">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
          />
        </Field>
        <Field label="Stock">
          <select
            value={params.get('status') ?? ''}
            onChange={(e) =>
              setParams(e.target.value ? { status: e.target.value } : {})
            }
          >
            <option value="">All products</option>
            <option value="low-stock">Low stock</option>
          </select>
        </Field>
      </div>
      {query.isPending ? (
        <Skeleton />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        <Table
          rows={rows}
          rowKey={(p) => p.id}
          empty="No products yet. Add your first product, then record a purchase to add stock."
          columns={[
            { label: 'Product', render: (p) => p.name },
            { label: 'Category', render: (p) => p.category_name },
            { label: 'In Stock', render: (p) => p.current_stock },
            {
              label: 'Selling Price',
              render: (p) => formatRWF(p.selling_price),
            },
            {
              label: 'Status',
              render: (p) => (
                <span className="badge">
                  {!p.is_active
                    ? 'Inactive'
                    : p.current_stock === 0
                      ? 'Out of Stock'
                      : p.current_stock <= p.low_stock_level
                        ? 'Low Stock'
                        : 'In Stock'}
                </span>
              ),
            },
            {
              label: 'Actions',
              render: (p) => (
                <div className="actions">
                  <button onClick={() => setView(p)}>View</button>
                  <button
                    onClick={() => {
                      save.reset()
                      setEdit(p)
                    }}
                  >
                    Edit
                  </button>
                  {p.is_active && (
                    <button
                      onClick={() => {
                        save.reset()
                        setDeactivate(p)
                      }}
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
      {edit && (
        <Modal
          title={item ? 'Edit Product' : 'Add Product'}
          onClose={() => !save.isPending && setEdit(null)}
        >
          {categories.isPending ? (
            <Skeleton />
          ) : categories.error ? (
            <ErrorState
              error={categories.error}
              retry={() => categories.refetch()}
            />
          ) : (
            <Form
              pending={save.isPending}
              error={save.error}
              onSubmit={(data) =>
                save.mutate({
                  path: item ? `/products/${item.id}` : '/products',
                  method: item ? 'PUT' : 'POST',
                  body: {
                    ...Object.fromEntries(data),
                    units_per_pack: Number(data.get('units_per_pack')),
                    selling_price: Number(data.get('selling_price')),
                    low_stock_level: Number(data.get('low_stock_level')),
                  },
                })
              }
            >
              <Field label="Product Name">
                <input name="name" required defaultValue={item?.name} />
              </Field>
              <Field label="Category">
                <select
                  name="category_id"
                  required
                  defaultValue={item?.category_id ?? ''}
                >
                  <option value="">Choose category</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="form-grid">
                <Field label="Units per Pack">
                  <input
                    name="units_per_pack"
                    type="number"
                    min="1"
                    step="1"
                    required
                    defaultValue={item?.units_per_pack ?? 1}
                  />
                </Field>
                <Field label="Selling Price per Item">
                  <input
                    name="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={item?.selling_price}
                  />
                </Field>
                <Field label="Low Stock Alert">
                  <input
                    name="low_stock_level"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={item?.low_stock_level ?? 5}
                  />
                </Field>
              </div>
              <Field label="Description (optional)">
                <textarea name="description" defaultValue={item?.description} />
              </Field>
              {!item && (
                <p className="muted">
                  New products start with 0 stock. Record a purchase to receive
                  items.
                </p>
              )}
            </Form>
          )}
        </Modal>
      )}
      {view && (
        <Modal title={view.name} onClose={() => setView(null)}>
          <dl className="details">
            <dt>Category</dt>
            <dd>{view.category_name}</dd>
            <dt>In stock</dt>
            <dd>{view.current_stock}</dd>
            <dt>Units per pack</dt>
            <dd>{view.units_per_pack}</dd>
            <dt>Selling price per item</dt>
            <dd>{formatRWF(view.selling_price)}</dd>
            <dt>Description</dt>
            <dd>{view.description || '—'}</dd>
          </dl>
        </Modal>
      )}
      {deactivate && (
        <Modal
          title="Deactivate Product"
          onClose={() => !save.isPending && setDeactivate(null)}
        >
          <p>
            Deactivate {deactivate.name}? It will no longer be offered in new
            transactions.
          </p>
          <Form
            pending={save.isPending}
            error={save.error}
            label="Deactivate"
            onSubmit={() =>
              save.mutate({
                path: `/products/${deactivate.id}/deactivate`,
                method: 'PATCH',
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
