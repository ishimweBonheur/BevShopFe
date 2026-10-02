const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
let token = sessionStorage.getItem('bevshop-token')
export function setToken(value: string | null) {
  token = value
  if (value) sessionStorage.setItem('bevshop-token', value)
  else sessionStorage.removeItem('bevshop-token')
}
export const hasToken = () => Boolean(token)
const messages: Record<string, string> = {
  'invalid email or password': 'The email or password is incorrect.',
  'current password is invalid': 'Your current password is incorrect.',
  'shop owner already set up':
    'This shop already has an owner. Please sign in.',
  'setup required': 'Please set up your shop first.',
  'insufficient stock':
    'There are not enough items available. Refresh the products and check the quantity.',
  'category is being used by products':
    'This category cannot be deleted because it is being used by products.',
  'supplier has purchase history':
    'This supplier cannot be deleted because it has purchase history.',
  'product already exists': 'Product already exists.',
  'category already exists': 'Category already exists.',
  'supplier already exists': 'Supplier already exists.',
  'password must be at least 6 characters':
    'Your password must contain at least 6 characters.',
}
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
export async function apiClient<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${base}/api/v1${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(
      'Cannot reach the shop. Check your connection and try again.',
    )
  }
  const raw = await response.text()
  let data: unknown
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    throw new Error(
      'The shop returned an unexpected response. Please try again.',
    )
  }
  if (!response.ok) {
    const message = (data as { error?: string })?.error ?? ''
    if (
      response.status === 401 &&
      !['/auth/login', '/auth/setup'].includes(path) &&
      !(path === '/auth/password' && message === 'current password is invalid')
    ) {
      setToken(null)
      window.dispatchEvent(new Event('session-expired'))
    }
    throw new ApiError(
      messages[message] ??
        (response.status === 401
          ? 'Please sign in again.'
          : response.status >= 500 && message
            ? `The server could not complete this request: ${message}.`
          : 'We could not complete this request. Please check your entries and try again.'),
      response.status,
    )
  }
  return data as T
}
export async function list<T>(path: string): Promise<T[]> {
  return (await apiClient<T[] | null>(path)) ?? []
}
