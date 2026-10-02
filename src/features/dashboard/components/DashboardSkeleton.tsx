export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-line bg-surface p-4 shadow-sm animate-pulse"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-line" />
              <div className="h-10 w-10 rounded-xl bg-line" />
            </div>
            <div className="h-7 w-28 rounded bg-line" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-line bg-surface p-4 shadow-sm animate-pulse"
          >
            <div className="mb-4 h-3 w-20 rounded bg-line" />
            <div className="h-8 w-32 rounded bg-line" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm animate-pulse">
        <div className="mb-4 h-4 w-32 rounded bg-line" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 rounded-xl bg-line" />
          ))}
        </div>
      </div>
    </div>
  )
}
