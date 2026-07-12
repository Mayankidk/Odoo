import { useDashboardKpis } from "@/hooks/queries"
import type { DashboardKpis } from "@/lib/database.types"
import { 
  Package, 
  CheckCircle, 
  Wrench, 
  Calendar, 
  ArrowRightLeft, 
  Clock, 
  AlertTriangle 
} from "lucide-react"

const kpiCards: Array<{
  label: string
  key: keyof DashboardKpis
  danger?: boolean
  icon: any
  gradient: string
}> = [
  { label: "Available Assets", key: "assets_available", icon: CheckCircle, gradient: "from-emerald-500 to-emerald-400" },
  { label: "Allocated Assets", key: "assets_allocated", icon: Package, gradient: "from-blue-500 to-blue-400" },
  { label: "Maintenance Today", key: "maintenance_today", icon: Wrench, gradient: "from-amber-500 to-amber-400" },
  { label: "Active Bookings", key: "active_bookings", icon: Calendar, gradient: "from-indigo-500 to-indigo-400" },
  { label: "Pending Transfers", key: "pending_transfers", icon: ArrowRightLeft, gradient: "from-purple-500 to-purple-400" },
  { label: "Upcoming Returns", key: "upcoming_returns", icon: Clock, gradient: "from-cyan-500 to-cyan-400" },
  { label: "Overdue Returns", key: "overdue_returns", danger: true, icon: AlertTriangle, gradient: "from-rose-500 to-rose-400" },
] as const

export function DashboardPage() {
  const { data: kpis, isLoading, error } = useDashboardKpis()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-2">Here's what's happening with your assets today.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700 backdrop-blur-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <div 
            key={card.key} 
            className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-12`}>
              <card.icon className="w-24 h-24" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-slate-600">{card.label}</h3>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p className={`text-4xl font-bold tracking-tight ${card.danger ? "text-rose-600" : "text-slate-900"}`}>
                  {isLoading ? (
                    <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" />
                  ) : (
                    kpis?.[card.key] ?? 0
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 min-h-[400px]">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Recent Allocations</h2>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            Activity Chart Placeholder
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 min-h-[400px]">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Pending Actions</h2>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            Action List Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
