import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient, hasToken, setToken } from '../../lib/apiClient'
import { ErrorState, Field, Form, Skeleton } from '../../components/ui'
type User = { name: string; email: string; phone?: string }
export function AuthGuard() {
  const client = useQueryClient()
  const navigate = useNavigate()
  useEffect(() => {
    const expire = () => {
      client.clear()
      navigate('/login', { replace: true })
    }
    window.addEventListener('session-expired', expire)
    return () => window.removeEventListener('session-expired', expire)
  }, [client, navigate])
  const query = useQuery({
    queryKey: ['auth'],
    queryFn: () => apiClient<User>('/auth/me'),
    enabled: hasToken(),
    retry: false,
  })
  if (!hasToken()) return <Navigate to="/login" replace />
  if (query.isPending) return <Skeleton />
  if (query.error)
    return <ErrorState error={query.error} retry={() => query.refetch()} />
  return <Outlet />
}
export function AuthPage({ setup = false }: { setup?: boolean }) {
  const navigate = useNavigate()
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient<{ token: string; user: User }>(
        setup ? '/auth/setup' : '/auth/login',
        'POST',
        Object.fromEntries(data),
      ),
    onSuccess: (result) => {
      client.clear()
      setToken(result.token)
      client.setQueryData(['auth'], result.user)
      navigate('/dashboard', { replace: true })
    },
  })
  if (hasToken()) return <Navigate to="/dashboard" replace />
  return (
    <main className="auth-shell">
      <div className="panel auth-card">
        <h1>{setup ? 'Set up your shop' : 'Welcome to BevShop'}</h1>
        <p className="muted mb-6">
          {setup
            ? 'Create the owner account to get started.'
            : 'Sign in to manage your shop.'}
        </p>
        <Form
          onSubmit={(d) => mutation.mutate(d)}
          pending={mutation.isPending}
          error={mutation.error}
          label={setup ? 'Create owner account' : 'Sign in'}
        >
          {setup && (
            <>
              <Field label="Name">
                <input name="name" required autoComplete="name" />
              </Field>
              <Field label="Phone">
                <input name="phone" type="tel" autoComplete="tel" />
              </Field>
            </>
          )}
          <Field label="Email">
            <input type="email" name="email" required autoComplete="email" />
          </Field>
          <Field label="Password">
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete={setup ? 'new-password' : 'current-password'}
            />
          </Field>
        </Form>
        <p className="mt-6">
          <Link to={setup ? '/login' : '/setup'}>
            {setup
              ? 'Already set up? Sign in'
              : 'New shop? Set up your owner account'}
          </Link>
        </p>
      </div>
    </main>
  )
}
export function ProfilePage() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const user = client.getQueryData<User>(['auth'])!
  const profile = useMutation({
    mutationFn: (data: FormData) =>
      apiClient<User>('/auth/profile', 'PUT', Object.fromEntries(data)),
    onSuccess: (data) => {
      client.setQueryData(['auth'], data)
      toast.success('Profile updated.')
    },
  })
  const password = useMutation({
    mutationFn: (data: FormData) =>
      apiClient('/auth/password', 'PUT', Object.fromEntries(data)),
    onSuccess: () => {
      toast.success('Password changed.')
      document.querySelector<HTMLFormElement>('#password-form form')?.reset()
    },
  })
  const logout = useMutation({
    mutationFn: () => apiClient('/auth/logout', 'POST'),
    onSuccess: () => {
      setToken(null)
      client.clear()
      navigate('/login', { replace: true })
    },
  })
  return (
    <div className="space-y-6">
      <h1>Profile</h1>
      <section className="panel">
        <Form
          onSubmit={(d) => profile.mutate(d)}
          pending={profile.isPending}
          error={profile.error}
          label="Update Profile"
        >
          <Field label="Name">
            <input name="name" required defaultValue={user.name} />
          </Field>
          <Field label="Email">
            <input type="email" value={user.email} readOnly />
            <small>Your sign-in email cannot be changed.</small>
          </Field>
          <Field label="Phone">
            <input name="phone" type="tel" defaultValue={user.phone} />
          </Field>
        </Form>
      </section>
      <section className="panel" id="password-form">
        <h2>Change Password</h2>
        <Form
          onSubmit={(d) => password.mutate(d)}
          pending={password.isPending}
          error={password.error}
          label="Change Password"
        >
          <Field label="Current password">
            <input
              type="password"
              name="current_password"
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              name="new_password"
              minLength={6}
              required
              autoComplete="new-password"
            />
          </Field>
        </Form>
      </section>
      <button
        className="btn secondary"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        Logout
      </button>
      {logout.error && <ErrorState error={logout.error} />}
    </div>
  )
}
