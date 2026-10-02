import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { AppLayout } from './features/layout/AppLayout'
import { AuthGuard, AuthPage, ProfilePage } from './features/auth/Auth'
import { ProductsPage } from './features/products/ProductsPage'
import { RecordsPage } from './features/records/RecordsPage'
import { TransactionsPage } from './features/transactions/TransactionsPage'
import { HistoryPage, ReportsPage } from './features/reports/ReportsPage'
export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/setup" element={<AuthPage key="setup" setup />} />
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/account"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            {(
              [
                'categories',
                'suppliers',
                'expenses',
                'damaged-items',
                'owner-money',
              ] as const
            ).map((resource) => (
              <Route
                key={resource}
                path={`/${resource}`}
                element={<RecordsPage key={resource} resource={resource} />}
              />
            ))}
            {(['purchases', 'sales'] as const).map((resource) => (
              <Route
                key={resource}
                path={`/${resource}`}
                element={
                  <TransactionsPage key={resource} resource={resource} />
                }
              />
            ))}
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
