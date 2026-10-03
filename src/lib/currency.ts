export function formatRWF(value: number | null | undefined): string {
  const numericValue =
    typeof value === 'number' && Number.isFinite(value) ? value : 0

  return `RWF ${numericValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}
