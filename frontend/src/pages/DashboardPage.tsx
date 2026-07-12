import { useDashboardKpis } from "@/hooks/queries"
import type { DashboardKpis } from "@/lib/database.types"

const kpiCards: Array<{
  label: string
  key: keyof DashboardKpis
  danger?: boolean
}> = [
  { label: "Available Assets", key: "assets_available" },
  { label: "Allocated Assets", key: "assets_allocated" },
  { label: "Maintenance Today", key: "maintenance_today" },
  { label: "Active Bookings", key: "active_bookings" },
  { label: "Pending Transfers", key: "pending_transfers" },
  { label: "Upcoming Returns", key: "upcoming_returns" },
  { label: "Overdue Returns", key: "overdue_returns", danger: true },
] as const

export function DashboardPage() {
  const { data: kpis, isLoading, error } = useDashboardKpis()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your organization's assets and activities.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.key} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">{card.label}</h3>
            <p className={`text-3xl font-bold mt-2 ${card.danger ? "text-red-600" : "text-slate-900"}`}>
              {isLoading ? "..." : kpis?.[card.key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Allocations</h2>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
            Chart / Table Placeholder
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Requests</h2>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
            List Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
