import { useState, useCallback } from "react"
import {
  BarChart3, TrendingUp, Wrench, AlertTriangle,
  Building2, CalendarDays, Download, RefreshCw,
  Package, DollarSign, Users, Activity,
} from "lucide-react"
import {
  useReportsSummary,
  useUtilizationTrends,
  useMaintenanceStats,
  useAssetsForAttention,
  useDepartmentAllocation,
  useBookingHeatmap,
} from "@/hooks/queries"
import { MiniBarChart } from "@/components/reports/MiniBarChart"
import { MultiLineChart } from "@/components/reports/MultiLineChart"
import { DonutChart } from "@/components/reports/DonutChart"
import { BookingHeatmap } from "@/components/reports/BookingHeatmap"
import { DepartmentTable } from "@/components/reports/DepartmentTable"
import { AttentionTables } from "@/components/reports/AttentionTables"
import { cn } from "@/lib/utils"

// ─── Shared primitives ─────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6", className)}>
      {children}
    </div>
  )
}

function SectionHeading({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-slate-100 rounded-xl animate-pulse", className)} />
}

// ─── KPI summary card ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  available: "#10b981", allocated: "#6366f1", reserved: "#f59e0b",
  under_maintenance: "#f97316", lost: "#ef4444", retired: "#94a3b8", disposed: "#64748b",
}

function SummaryKpiRow({ isLoading, summary }: { isLoading: boolean; summary: any }) {
  const kpis = [
    { label: "Total Assets", value: summary?.total_assets, icon: Package, color: "from-indigo-500 to-indigo-400" },
    { label: "Asset Value", value: summary?.total_asset_value != null ? `$${Number(summary.total_asset_value).toLocaleString()}` : null, icon: DollarSign, color: "from-emerald-500 to-emerald-400" },
    { label: "Utilization Rate", value: summary?.utilization_rate != null ? `${summary.utilization_rate}%` : null, icon: Activity, color: "from-violet-500 to-violet-400" },
    { label: "Active Users", value: summary?.total_users, icon: Users, color: "from-sky-500 to-sky-400" },
    { label: "Bookings (30d)", value: summary?.total_bookings_30d, icon: CalendarDays, color: "from-pink-500 to-pink-400" },
    { label: "Maintenance (30d)", value: summary?.total_maintenance_30d, icon: Wrench, color: "from-amber-500 to-amber-400" },
    { label: "Departments", value: summary?.total_departments, icon: Building2, color: "from-cyan-500 to-cyan-400" },
    { label: "Resolution Rate", value: summary?.resolved_maintenance != null ? `${summary.resolved_maintenance}%` : null, icon: TrendingUp, color: "from-teal-500 to-teal-400" },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
      {kpis.map((k) => (
        <div key={k.label} className="group bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.color} text-white flex items-center justify-center shadow-sm`}>
            <k.icon className="w-4 h-4" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-2xl font-bold text-slate-800 leading-none">{k.value ?? 0}</p>
          )}
          <p className="text-xs text-slate-500">{k.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",      label: "Overview",        icon: BarChart3 },
  { id: "utilization",   label: "Utilization",     icon: TrendingUp },
  { id: "maintenance",   label: "Maintenance",     icon: Wrench },
  { id: "attention",     label: "Attention Items",  icon: AlertTriangle },
  { id: "departments",   label: "Departments",     icon: Building2 },
  { id: "bookings",      label: "Booking Heatmap", icon: CalendarDays },
] as const

type TabId = typeof TABS[number]["id"]

// ─── EXPORT ───────────────────────────────────────────────────────────────────

function exportCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))]
  const blob = new Blob([lines.join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [tab, setTab] = useState<TabId>("overview")
  const [months, setMonths] = useState(6)
  const [heatmapDays, setHeatmapDays] = useState(90)

  const summary       = useReportsSummary()
  const utilization   = useUtilizationTrends(months)
  const maintenance   = useMaintenanceStats()
  const attention     = useAssetsForAttention()
  const departments   = useDepartmentAllocation()
  const heatmap       = useBookingHeatmap(heatmapDays)

  const handleExport = useCallback(() => {
    if (tab === "departments" && departments.data) {
      exportCSV("department_allocation.csv", departments.data as any[])
    } else if (tab === "attention" && attention.data?.overdue_returns) {
      exportCSV("overdue_returns.csv", attention.data.overdue_returns)
    } else if (tab === "bookings" && heatmap.data?.top_resources) {
      exportCSV("top_resources.csv", heatmap.data.top_resources)
    } else if (tab === "utilization" && utilization.data) {
      exportCSV("utilization_trends.csv", utilization.data as any[])
    } else if (tab === "maintenance" && maintenance.data?.by_category) {
      exportCSV("maintenance_by_category.csv", maintenance.data.by_category)
    } else {
      alert("No exportable data for this tab yet.")
    }
  }, [tab, departments.data, attention.data, heatmap.data, utilization.data, maintenance.data])

  const anyLoading = summary.isLoading || utilization.isLoading || maintenance.isLoading ||
    attention.isLoading || departments.isLoading || heatmap.isLoading
  const anyError   = summary.error || utilization.error || maintenance.error ||
    attention.error || departments.error || heatmap.error

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Live data from your AssetFlow database</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              summary.refetch(); utilization.refetch(); maintenance.refetch()
              attention.refetch(); departments.refetch(); heatmap.refetch()
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", anyLoading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {anyError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {(anyError as any)?.message ?? "Failed to load some analytics data. Ensure the Supabase migration has been applied."}
        </div>
      )}

      {/* KPI strip */}
      <SummaryKpiRow isLoading={summary.isLoading} summary={summary.data} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100/80 rounded-2xl overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              tab === t.id
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset status donut */}
          <Card>
            <SectionHeading icon={Package} title="Asset Status Breakdown" subtitle="Current distribution across all statuses" />
            {summary.isLoading ? <Skeleton className="h-40" /> : (
              <DonutChart
                data={Object.entries(summary.data?.asset_status_breakdown ?? {}).map(([k, v]) => ({
                  label: k.replace(/_/g, " "),
                  value: v as number,
                  color: STATUS_COLORS[k] ?? "#94a3b8",
                }))}
              />
            )}
          </Card>

          {/* Maintenance by priority donut */}
          <Card>
            <SectionHeading icon={Wrench} title="Maintenance by Priority" subtitle="Open & historical requests" />
            {maintenance.isLoading ? <Skeleton className="h-40" /> : (
              <DonutChart
                data={(maintenance.data?.by_priority ?? []).map((p: any) => ({
                  label: p.priority,
                  value: Number(p.count),
                  color: { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#10b981" }[p.priority as string] ?? "#94a3b8",
                }))}
              />
            )}
          </Card>

          {/* Monthly bookings bar */}
          <Card className="lg:col-span-2">
            <SectionHeading icon={CalendarDays} title="Monthly Bookings (6 months)" subtitle="Total, completed and cancelled" />
            {heatmap.isLoading ? <Skeleton className="h-48" /> : (
              <MultiLineChart
                labels={(heatmap.data?.monthly_bookings ?? []).map((m: any) => m.month)}
                series={[
                  { label: "Total",     color: "#6366f1", values: (heatmap.data?.monthly_bookings ?? []).map((m: any) => m.total) },
                  { label: "Completed", color: "#10b981", values: (heatmap.data?.monthly_bookings ?? []).map((m: any) => m.completed) },
                  { label: "Cancelled", color: "#ef4444", values: (heatmap.data?.monthly_bookings ?? []).map((m: any) => m.cancelled) },
                ]}
                height={200}
              />
            )}
          </Card>
        </div>
      )}

      {/* ── UTILIZATION TAB ── */}
      {tab === "utilization" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Show last</label>
            {[3, 6, 12].map((m) => (
              <button key={m}
                onClick={() => setMonths(m)}
                className={cn("px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border",
                  months === m ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                )}
              >{m} months</button>
            ))}
          </div>

          <Card>
            <SectionHeading icon={TrendingUp} title="Asset Utilization Trends" subtitle="Available vs allocated vs under maintenance" />
            {utilization.isLoading ? <Skeleton className="h-56" /> : (
              <MultiLineChart
                labels={(utilization.data ?? []).map((d: any) => d.month)}
                series={[
                  { label: "Available",    color: "#10b981", values: (utilization.data ?? []).map((d: any) => d.available) },
                  { label: "Allocated",    color: "#6366f1", values: (utilization.data ?? []).map((d: any) => d.allocated) },
                  { label: "Maintenance",  color: "#f97316", values: (utilization.data ?? []).map((d: any) => d.maintenance) },
                  { label: "Idle/Retired", color: "#94a3b8", values: (utilization.data ?? []).map((d: any) => d.idle) },
                ]}
                height={240}
              />
            )}
            <div className="mt-4 flex flex-wrap gap-4 justify-center">
              {[
                { label: "Available",    color: "#10b981" },
                { label: "Allocated",    color: "#6366f1" },
                { label: "Maintenance",  color: "#f97316" },
                { label: "Idle/Retired", color: "#94a3b8" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── MAINTENANCE TAB ── */}
      {tab === "maintenance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <SectionHeading icon={Wrench} title="Requests by Category" subtitle="Which asset types break most often" />
            {maintenance.isLoading ? <Skeleton className="h-48" /> : (
              <MiniBarChart
                data={(maintenance.data?.by_category ?? []).map((c: any) => ({
                  label: c.category,
                  value: Number(c.count),
                  color: "#6366f1",
                }))}
                height={200}
              />
            )}
          </Card>

          <Card>
            <SectionHeading icon={Wrench} title="Requests by Status" />
            {maintenance.isLoading ? <Skeleton className="h-48" /> : (
              <DonutChart
                data={(maintenance.data?.by_status ?? []).map((s: any) => ({
                  label: s.status.replace(/_/g, " "),
                  value: Number(s.count),
                  color: { pending: "#f59e0b", approved: "#6366f1", rejected: "#ef4444", assigned: "#8b5cf6", in_progress: "#f97316", resolved: "#10b981" }[s.status as string] ?? "#94a3b8",
                }))}
              />
            )}
          </Card>

          <Card className="lg:col-span-2">
            <SectionHeading icon={TrendingUp} title="Monthly Maintenance Trend" subtitle="Total vs resolved vs pending (last 6 months)" />
            {maintenance.isLoading ? <Skeleton className="h-48" /> : (
              <MultiLineChart
                labels={(maintenance.data?.monthly_trend ?? []).map((m: any) => m.month)}
                series={[
                  { label: "Total",    color: "#6366f1", values: (maintenance.data?.monthly_trend ?? []).map((m: any) => m.total) },
                  { label: "Resolved", color: "#10b981", values: (maintenance.data?.monthly_trend ?? []).map((m: any) => m.resolved) },
                  { label: "Pending",  color: "#f59e0b", values: (maintenance.data?.monthly_trend ?? []).map((m: any) => m.pending) },
                ]}
                height={220}
              />
            )}
          </Card>
        </div>
      )}

      {/* ── ATTENTION TAB ── */}
      {tab === "attention" && (
        <Card>
          <SectionHeading icon={AlertTriangle} title="Assets Requiring Attention" subtitle="Overdue returns, open maintenance, and poor-condition assets" />
          {attention.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <AttentionTables data={attention.data ?? null} />
          )}
        </Card>
      )}

      {/* ── DEPARTMENTS TAB ── */}
      {tab === "departments" && (
        <Card>
          <SectionHeading icon={Building2} title="Department-wise Allocation Summary" subtitle="Assets, users, bookings, and maintenance per department" />
          {departments.isLoading ? <Skeleton className="h-64" /> : (
            <DepartmentTable data={departments.data as any ?? null} />
          )}
        </Card>
      )}

      {/* ── BOOKING HEATMAP TAB ── */}
      {tab === "bookings" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Period</label>
            {[30, 60, 90].map((d) => (
              <button key={d}
                onClick={() => setHeatmapDays(d)}
                className={cn("px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border",
                  heatmapDays === d ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                )}
              >{d} days</button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Bookings", val: heatmap.data?.stats?.total_bookings },
              { label: "Avg Duration (hrs)", val: heatmap.data?.stats?.avg_duration_hrs },
              { label: "Utilization Rate", val: heatmap.data?.stats?.utilization_rate != null ? `${heatmap.data.stats.utilization_rate}%` : null },
              { label: "Unique Users", val: heatmap.data?.stats?.unique_users },
            ].map((s) => (
              <div key={s.label} className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                {heatmap.isLoading ? <Skeleton className="h-8 mb-2" /> : (
                  <p className="text-3xl font-bold text-indigo-700">{s.val ?? 0}</p>
                )}
                <p className="text-xs text-indigo-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <Card>
            <SectionHeading icon={CalendarDays} title="Peak Usage Heatmap" subtitle="Booking frequency by day-of-week and hour" />
            {heatmap.isLoading ? <Skeleton className="h-48" /> : (
              <BookingHeatmap data={heatmap.data?.heatmap ?? null} />
            )}
          </Card>

          <Card>
            <SectionHeading icon={BarChart3} title="Top Booked Resources" subtitle={`Most booked assets in the last ${heatmapDays} days`} />
            {heatmap.isLoading ? <Skeleton className="h-48" /> : (
              <MiniBarChart
                data={(heatmap.data?.top_resources ?? []).map((r: any) => ({
                  label: r.asset_tag,
                  value: r.booking_count,
                  color: "#6366f1",
                }))}
                height={200}
                formatValue={(v) => `${v} bookings`}
              />
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
