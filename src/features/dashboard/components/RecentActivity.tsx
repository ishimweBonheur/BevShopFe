import { formatRWF } from '../../../lib/currency'
import { formatActivityTime } from '../../../lib/date'
import { getActivityLabel, type DashboardActivity } from '../types'

interface RecentActivityProps {
  activities: DashboardActivity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-canvas p-8 text-center">
        <p className="text-lg font-medium text-ink">
          No activity recorded today.
        </p>
        <p className="mt-2 text-sm text-muted">
          Record your first sale or purchase to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-sm">
      <table className="min-w-full text-left text-sm text-muted">
        <thead className="bg-canvas text-ink">
          <tr>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">What Happened</th>
            <th className="px-4 py-3 font-medium">Details</th>
            <th className="px-4 py-3 font-medium">Qty</th>
            <th className="px-4 py-3 font-medium text-right">Amount</th>
          </tr>
        </thead>

        <tbody>
          {activities.map((activity) => (
            <tr
              key={activity.id}
              className="border-t border-line last:border-0"
            >
              <td className="px-4 py-3 align-top whitespace-nowrap">
                {formatActivityTime(activity.date)}
              </td>
              <td className="px-4 py-3 align-top whitespace-nowrap font-medium text-ink">
                {getActivityLabel(activity.type)}
              </td>
              <td className="px-4 py-3 align-top text-ink">
                {activity.description}
              </td>
              <td className="px-4 py-3 align-top whitespace-nowrap text-ink">
                {activity.quantity !== null && activity.quantity !== undefined
                  ? activity.quantity
                  : '-'}
              </td>
              <td className="px-4 py-3 align-top whitespace-nowrap text-right font-medium text-ink">
                {formatRWF(activity.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
