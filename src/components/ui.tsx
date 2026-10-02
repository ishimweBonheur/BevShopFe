import {
  useEffect,
  Children,
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from 'react'
export function Skeleton() {
  return (
    <div role="status" aria-label="Loading" className="panel space-y-4">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="skeleton" />
      ))}
    </div>
  )
}
export function ErrorState({
  error,
  retry,
}: {
  error: Error | null
  retry?: () => void
}) {
  return (
    <div className="panel" role="alert">
      <p>{error?.message ?? "We couldn't load this page."}</p>
      {retry && (
        <button className="btn secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  )
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement
    ref.current?.showModal()
    return () => previous?.focus()
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-content">
        <div className="page-heading">
          <h2 id={id}>{title}</h2>
          <button
            type="button"
            className="btn secondary"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {Children.map(children, (child) =>
        isValidElement<{ id?: string }>(child) &&
        ['input', 'select', 'textarea'].includes(String(child.type))
          ? cloneElement(child, { id })
          : child,
      )}
    </div>
  )
}
export function PageHeading({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      {action}
    </div>
  )
}
export function Form({
  children,
  onSubmit,
  pending,
  error,
  label = 'Save',
}: {
  children: ReactNode
  onSubmit: (data: FormData) => void
  pending: boolean
  error: Error | null
  label?: string
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onSubmit(new FormData(e.currentTarget))
      }}
    >
      <fieldset disabled={pending} className="space-y-4">
        {children}
      </fieldset>
      {error && (
        <p role="alert" className="error-text">
          {error.message}
        </p>
      )}
      <button className="btn" disabled={pending}>
        {pending ? 'Saving…' : label}
      </button>
    </form>
  )
}
export type Column<T> = { label: string; render: (row: T) => ReactNode }
export function Table<T>({
  rows,
  columns,
  empty = 'No records yet.',
  rowKey,
}: {
  rows: T[]
  columns: Column<T>[]
  empty?: string
  rowKey: (row: T) => string
}) {
  const [page, setPage] = useState(0)
  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / 15) - 1))
  return (
    <div className="panel table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(current * 15, current * 15 + 15).map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.label}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="empty">{empty}</p>}
      {rows.length > 15 && (
        <div className="pagination">
          <button
            className="btn secondary"
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </button>
          <span>
            Page {current + 1} of {Math.ceil(rows.length / 15)}
          </span>
          <button
            className="btn secondary"
            disabled={(current + 1) * 15 >= rows.length}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
