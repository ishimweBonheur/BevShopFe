import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  House,
  Menu,
  Package,
  ReceiptText,
  ShieldAlert,
  Store,
  TrendingUp,
  Truck,
  UserCircle,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: House },
  { label: 'Products', to: '/products', icon: Boxes },
  { label: 'Categories', to: '/categories', icon: ClipboardList },
  { label: 'Suppliers', to: '/suppliers', icon: Truck },
  { label: 'Purchases', to: '/purchases', icon: Package },
  { label: 'Sales', to: '/sales', icon: TrendingUp },
  { label: 'Expenses', to: '/expenses', icon: ReceiptText },
  { label: 'Damaged Items', to: '/damaged-items', icon: ShieldAlert },
  { label: 'Owner Money', to: '/owner-money', icon: CreditCard },
  { label: 'History', to: '/history', icon: BarChart3 },
  { label: 'Reports', to: '/reports', icon: ClipboardList },
  { label: 'Profile', to: '/profile', icon: UserCircle },
]
function Navigation({ close }: { close?: () => void }) {
  return (
    <>
      <div className="brand">
        <Store aria-hidden="true" />
        <div>
          <strong>BevShop</strong>
          <small>Shop owner</small>
        </div>
        {close && (
          <button onClick={close} aria-label="Close menu">
            <X />
          </button>
        )}
      </div>
      <nav aria-label="Main navigation">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={close}
            className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
export function AppLayout() {
  const [open, setOpen] = useState(false)
  const drawer = useRef<HTMLDialogElement>(null)
  const menu = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  useEffect(() => {
    if (open) drawer.current?.showModal()
    else drawer.current?.close()
  }, [open])
  const close = () => {
    setOpen(false)
    menu.current?.focus()
  }
  return (
    <div className="app-shell">
      <aside className="sidebar desktop-sidebar">
        <Navigation />
      </aside>
      <dialog
        className="mobile-drawer sidebar"
        ref={drawer}
        onCancel={(e) => {
          e.preventDefault()
          close()
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <Navigation close={close} />
      </dialog>
      <div className="app-main">
        <header className="app-header">
          <button
            ref={menu}
            type="button"
            className="btn secondary menu-button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="muted text-xs">BEVERAGE SHOP</p>
            <strong>
              {navItems.find((n) => n.to === location.pathname)?.label ??
                'BevShop'}
            </strong>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
