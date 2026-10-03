export function dateTime(value?: string) {
  return value
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Kigali',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—'
}
export function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
export function dateQuery(from: string, to: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', `${from}T00:00:00+02:00`)
  if (to) {
    const end = new Date(`${to}T00:00:00+02:00`)
    end.setUTCDate(end.getUTCDate() + 1)
    params.set('to', end.toISOString())
  }
  return params
}
export function periodDates(period: string): [string, string] {
  const end = today()
  const date = new Date(`${end}T12:00:00Z`)
  if (period === 'week')
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
  if (period === 'month') date.setUTCDate(1)
  if (period === 'year') {
    date.setUTCMonth(0)
    date.setUTCDate(1)
  }
  const last = new Date(date)
  if (period === 'week') last.setUTCDate(last.getUTCDate() + 6)
  if (period === 'month') { last.setUTCMonth(last.getUTCMonth() + 1); last.setUTCDate(0) }
  if (period === 'year') { last.setUTCFullYear(last.getUTCFullYear() + 1); last.setUTCDate(0) }
  return [date.toISOString().slice(0, 10), last.toISOString().slice(0, 10)]
}
