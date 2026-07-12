import type { DepartmentAllocationRow } from "@/lib/database.types"

interface Props { data: DepartmentAllocationRow[] | null }

export function DepartmentTable({ data }: Props) {
  if (!data || !data.length) {
    return (
      <div className="text-slate-400 text-sm text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No department data available
      </div>
    )
  }

  const maxAssets = Math.max(...data.map((d) => d.total_assets), 1)

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {["Department", "Total Assets", "Allocated", "Available", "Maintenance", "Users", "Active Bookings", "Open Requests"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((d) => {
            const allocPct = d.total_assets ? Math.round((d.allocated / d.total_assets) * 100) : 0
            return (
              <tr key={d.department_id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{d.department_name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(d.total_assets / maxAssets) * 100}%` }} />
                    </div>
                    <span className="font-semibold text-slate-700">{d.total_assets}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    {d.allocated} <span className="text-blue-400">({allocPct}%)</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-emerald-600 font-medium">{d.available}</td>
                <td className="px-4 py-3 text-amber-600 font-medium">{d.maintenance}</td>
                <td className="px-4 py-3 text-slate-600">{d.users_count}</td>
                <td className="px-4 py-3 text-indigo-600 font-medium">{d.active_bookings}</td>
                <td className="px-4 py-3">
                  {d.open_requests > 0 ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">{d.open_requests}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
