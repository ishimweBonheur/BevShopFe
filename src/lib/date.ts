const KIGALI_TIME_ZONE = 'Africa/Kigali'

export function formatDashboardDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: KIGALI_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatActivityTime(value: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: KIGALI_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
