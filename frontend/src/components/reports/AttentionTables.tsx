import type { AssetsForAttention } from "@/lib/database.types"
import { AlertTriangle, Clock, Wrench } from "lucide-react"

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700",
  high:     "bg-orange-100 text-orange-700",
  medium:   "bg-amber-100 text-amber-700",
  low:      "bg-slate-100 text-slate-600",
}

const CONDITION_COLORS: Record<string, string> = {
  damaged: "bg-rose-100 text-rose-700",
  poor:    "bg-orange-100 text-orange-700",
}

interface Props { data: AssetsForAttention | null }

export function AttentionTables({ data }: Props) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Overdue Returns */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-rose-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Overdue Returns</h3>
          <span className="ml-auto text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
            {data.summary.total_overdue_returns} total
          </span>
        </div>
        {!data.overdue_returns?.length ? (
          <p className="text-sm text-slate-400 italic">No overdue returns 🎉</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-rose-50 border-b border-slate-200">
                <tr>
                  {["Asset", "Tag", "Dept", "Return Date", "Days Overdue", "Condition"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-rose-700 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.overdue_returns.map((r) => (
                  <tr key={r.asset_id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-3 py-2 font-medium text-slate-700">{r.asset_name}</td>
                    <td className="px-3 py-2 text-slate-500 font-mono">{r.asset_tag}</td>
                    <td className="px-3 py-2 text-slate-500">{r.department ?? "—"}</td>
                    <td className="px-3 py-2 text-rose-600">{r.return_date}</td>
                    <td className="px-3 py-2">
                      <span className="font-bold text-rose-700">{r.days_overdue}d</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full capitalize font-medium ${CONDITION_COLORS[r.condition] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.condition}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open Maintenance */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Open Maintenance Requests</h3>
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {data.summary.total_open_maintenance} open
          </span>
        </div>
        {!data.open_maintenance?.length ? (
          <p className="text-sm text-slate-400 italic">No open maintenance requests 🎉</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-amber-50 border-b border-slate-200">
                <tr>
                  {["Asset", "Tag", "Priority", "Status", "Days Open", "Description"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-amber-700 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.open_maintenance.map((m) => (
                  <tr key={m.request_id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-3 py-2 font-medium text-slate-700">{m.asset_name}</td>
                    <td className="px-3 py-2 text-slate-500 font-mono">{m.asset_tag}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${PRIORITY_COLORS[m.priority] ?? "bg-slate-100 text-slate-600"}`}>
                        {m.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2 capitalize text-slate-600">{m.status.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 font-bold text-amber-700">{m.days_open}d</td>
                    <td className="px-3 py-2 text-slate-500 max-w-[200px] truncate">{m.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Poor Condition */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Assets in Poor / Damaged Condition</h3>
          <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
            {data.summary.total_poor_condition} assets
          </span>
        </div>
        {!data.poor_condition?.length ? (
          <p className="text-sm text-slate-400 italic">All assets in good condition 🎉</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-orange-50 border-b border-slate-200">
                <tr>
                  {["Asset", "Tag", "Category", "Dept", "Condition", "Status", "Age (days)"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-orange-700 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.poor_condition.map((p) => (
                  <tr key={p.asset_id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-3 py-2 font-medium text-slate-700">{p.asset_name}</td>
                    <td className="px-3 py-2 text-slate-500 font-mono">{p.asset_tag}</td>
                    <td className="px-3 py-2 text-slate-500">{p.category}</td>
                    <td className="px-3 py-2 text-slate-500">{p.department ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${CONDITION_COLORS[p.condition] ?? "bg-slate-100 text-slate-600"}`}>
                        {p.condition}
                      </span>
                    </td>
                    <td className="px-3 py-2 capitalize text-slate-600">{p.status.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 text-slate-600">{p.age_days ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
