import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useDashboardKpis, useTransferRequests, useMaintenanceRequests, useAllocations } from "@/hooks/queries"
import { useApproveTransferRequest, useRejectTransferRequest, useUpdateMaintenanceStatus } from "@/hooks/mutations"
import { useAuthStore } from "@/stores/authStore"
import type { DashboardKpis } from "@/lib/database.types"
import { toast } from "sonner"
import { 
  Package, 
  CheckCircle, 
  Wrench, 
  Calendar, 
  ArrowRightLeft, 
  Clock, 
  AlertTriangle,
  X,
  Plus,
  Lock
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
  const navigate = useNavigate()
  const [rejectingAction, setRejectingAction] = useState<{ type: "transfer" | "maintenance"; data: any } | null>(null)
  
  const profile = useAuthStore((state) => state.profile)
  const isManagerOrAdmin = profile?.role === "admin" || profile?.role === "asset_manager" || profile?.role === "department_head"
  const isAssetManagerOrAdmin = profile?.role === "admin" || profile?.role === "asset_manager"
  const canRegisterAsset = profile?.role === "admin" || profile?.role === "asset_manager"

  // Queries
  const { data: kpis, isLoading: isLoadingKpis, error: kpisError } = useDashboardKpis()
  const { data: pendingTransfers = [], isLoading: isLoadingTransfers } = useTransferRequests({ status: "pending" })
  const { data: maintenanceRequests = [], isLoading: isLoadingMaintenance } = useMaintenanceRequests()
  const { data: allocations = [], isLoading: isLoadingAllocations } = useAllocations()

  // Mutations
  const approveTransferMutation = useApproveTransferRequest()
  const rejectTransferMutation = useRejectTransferRequest()
  const updateMaintenanceStatusMutation = useUpdateMaintenanceStatus()

  const handleApproveTransfer = async (requestId: string) => {
    try {
      await approveTransferMutation.mutateAsync({ requestId })
      toast.success("Transfer request approved and asset re-allocated!")
    } catch (err: any) {
      toast.error(err.message || "Failed to approve transfer")
    }
  }

  const handleApproveMaintenance = async (requestId: string, assetId: string) => {
    try {
      await updateMaintenanceStatusMutation.mutateAsync({
        requestId,
        status: "approved",
        assetId,
      })
      toast.success("Maintenance request approved and asset marked under maintenance!")
    } catch (err: any) {
      toast.error(err.message || "Failed to approve maintenance request")
    }
  }

  const handleRejectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rejectingAction) return

    const formData = new FormData(event.currentTarget)
    const reason = String(formData.get("reason")).trim()

    if (!reason) {
      toast.error("Please provide a reason for rejection.")
      return
    }

    try {
      if (rejectingAction.type === "transfer") {
        await rejectTransferMutation.mutateAsync({
          requestId: rejectingAction.data.id,
          rejectionReason: reason,
        })
        toast.success("Transfer request rejected.")
      } else {
        await updateMaintenanceStatusMutation.mutateAsync({
          requestId: rejectingAction.data.id,
          status: "rejected",
          assetId: rejectingAction.data.asset_id,
          resolutionNotes: reason,
        })
        toast.success("Maintenance request rejected.")
      }
      setRejectingAction(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to reject request")
    }
  }

  // Combine pending transfers and maintenance requests
  const pendingMaintenance = maintenanceRequests.filter((req: any) => req.status === "pending")
  const combinedPendingActions = [
    ...pendingTransfers.map((t: any) => ({
      ...t,
      actionType: "transfer" as const,
      sortDate: new Date(t.created_at),
    })),
    ...pendingMaintenance.map((m: any) => ({
      ...m,
      actionType: "maintenance" as const,
      sortDate: new Date(m.created_at),
    })),
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())

  // Process allocations for the last 7 days chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d
  }).reverse()

  const chartData = last7Days.map(date => {
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const count = allocations.filter(alloc => {
      const allocDate = new Date(alloc.created_at)
      return allocDate >= dayStart && allocDate <= dayEnd
    }).length

    return { label, count }
  })

  const maxVal = Math.max(...chartData.map(d => d.count), 4)
  const recentFeed = allocations.slice(0, 4)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-2">Here's what's happening with your assets today.</p>
      </div>

      {kpisError && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700 backdrop-blur-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          {kpisError.message}
        </div>
      )}

      {/* Quick Actions Panel */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Register Asset */}
          <button
            onClick={() => {
              if (canRegisterAsset) {
                navigate("/assets")
              }
            }}
            disabled={!canRegisterAsset}
            className={`group flex items-center justify-between p-5 rounded-2xl border transition-all text-left ${
              canRegisterAsset
                ? "bg-white border-slate-200/60 hover:border-blue-500 hover:shadow-md cursor-pointer hover:-translate-y-0.5"
                : "bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">Register Asset</span>
                {!canRegisterAsset && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    <Lock className="w-2.5 h-2.5" /> Manager Only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Add new organization equipment</p>
            </div>
            <div className={`p-3 rounded-xl transition-all ${
              canRegisterAsset
                ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                : "bg-slate-100 text-slate-400"
            }`}>
              <Plus className="w-5 h-5" />
            </div>
          </button>

          {/* Book Resource */}
          <button
            onClick={() => navigate("/bookings", { state: { openModal: true } })}
            className="group flex items-center justify-between p-5 rounded-2xl border bg-white border-slate-200/60 hover:border-violet-500 hover:shadow-md cursor-pointer transition-all text-left hover:-translate-y-0.5"
          >
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 text-sm">Book Resource</span>
              <p className="text-xs text-slate-400">Reserve rooms, spaces, or shared assets</p>
            </div>
            <div className="p-3 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
              <Calendar className="w-5 h-5" />
            </div>
          </button>

          {/* Raise Maintenance Request */}
          <button
            onClick={() => navigate("/maintenance", { state: { openModal: true } })}
            className="group flex items-center justify-between p-5 rounded-2xl border bg-white border-slate-200/60 hover:border-amber-500 hover:shadow-md cursor-pointer transition-all text-left hover:-translate-y-0.5"
          >
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 text-sm">Raise Maintenance</span>
              <p className="text-xs text-slate-400">Report broken or faulty equipment</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Wrench className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
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
                  {isLoadingKpis ? (
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

      {/* Main Dashboard Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col justify-between min-h-[450px]">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent Allocations</h2>
            <p className="text-xs text-slate-400 mt-1">Daily asset assignment volume over the last 7 days</p>
          </div>
          
          <div className="my-6 flex flex-col items-stretch">
            {isLoadingAllocations ? (
              <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
                Loading allocation trends...
              </div>
            ) : (
              <div className="relative w-full h-44 flex items-end justify-between px-2 bg-slate-50/40 rounded-xl border border-slate-100 pt-8 pb-4">
                {/* SVG for Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 opacity-50">
                  <div className="border-t border-slate-200/60 w-full" />
                  <div className="border-t border-slate-200/60 w-full" />
                  <div className="border-t border-slate-200/60 w-full" />
                </div>
                
                {chartData.map((d, index) => {
                  const percentage = (d.count / maxVal) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative z-10">
                      {/* Tooltip */}
                      <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-md pointer-events-none z-20 whitespace-nowrap">
                        {d.count} {d.count === 1 ? "allocation" : "allocations"}
                      </span>
                      
                      {/* Bar */}
                      <div 
                        style={{ height: `${percentage}%` }}
                        className="w-8 sm:w-12 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-500 hover:from-blue-500 hover:to-indigo-400 hover:shadow-lg group-hover:scale-x-105 min-h-[4px]"
                      />
                      <span className="text-[10px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Feed Table */}
          <div className="border-t border-slate-100 pt-4 flex-1">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Latest Allocations</h3>
            {isLoadingAllocations ? (
              <div className="text-slate-400 text-xs py-4">Loading allocations list...</div>
            ) : recentFeed.length === 0 ? (
              <div className="text-slate-400 text-xs italic py-4">No recent allocations to display.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentFeed.map((alloc: any) => (
                  <div key={alloc.id} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{alloc.asset?.name}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{alloc.asset?.asset_tag}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-600 font-medium">{alloc.user?.name || alloc.department?.name || "Shared"}</div>
                      <div className="text-slate-400 text-[10px]">
                        {new Date(alloc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Actions Approval Queue */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 min-h-[450px] flex flex-col">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Pending Actions</h2>
            <p className="text-xs text-slate-400 mt-1">Tasks requiring your review or approval</p>
          </div>
          
          {isLoadingTransfers || isLoadingMaintenance ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Loading pending actions...
            </div>
          ) : combinedPendingActions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 mt-6">
              All clear! No pending actions today.
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[350px] pr-1 mt-6">
              {combinedPendingActions.map((req: any) => {
                const isTransfer = req.actionType === "transfer"
                const canApproveAction = isTransfer ? isManagerOrAdmin : isAssetManagerOrAdmin
                
                return (
                  <div key={req.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-950 text-sm truncate">
                          {isTransfer 
                            ? (req.allocation?.asset?.name || "Unknown Asset")
                            : (req.asset?.name || "Unknown Asset")
                          }
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                          {isTransfer
                            ? (req.allocation?.asset?.asset_tag || "No Tag")
                            : (req.asset?.asset_tag || "No Tag")
                          }
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset flex-shrink-0 ${
                        isTransfer 
                          ? "bg-purple-50 text-purple-700 ring-purple-700/10" 
                          : "bg-amber-50 text-amber-700 ring-amber-700/10"
                      }`}>
                        {isTransfer ? "Transfer" : "Maintenance"}
                      </span>
                    </div>

                    {isTransfer ? (
                      <div className="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400">Requested by:</span>{" "}
                          <span className="font-medium text-slate-800">{req.requested_by?.name || "Unknown"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Current holder:</span>{" "}
                          <span className="font-medium text-slate-800">
                            {req.allocation?.holder?.name || req.allocation?.holder_dept?.name || "Shared"}
                          </span>
                        </div>
                        {req.reason && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 italic text-slate-500">
                            "{req.reason}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400">Raised by:</span>{" "}
                          <span className="font-medium text-slate-800">{req.raised_by?.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Priority:</span>{" "}
                          <span className={`font-semibold capitalize px-1 py-0.5 rounded text-[10px] ${
                            req.priority === "critical" ? "bg-rose-50 text-rose-700" :
                            req.priority === "high" ? "bg-amber-50 text-amber-700" :
                            req.priority === "medium" ? "bg-blue-50 text-blue-700" :
                            "bg-slate-50 text-slate-700"
                          }`}>
                            {req.priority || "medium"}
                          </span>
                        </div>
                        {req.description && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 italic text-slate-500">
                            "{req.description}"
                          </div>
                        )}
                      </div>
                    )}

                    {canApproveAction && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (isTransfer) {
                              handleApproveTransfer(req.id)
                            } else {
                              handleApproveMaintenance(req.id, req.asset_id)
                            }
                          }}
                          disabled={
                            approveTransferMutation.isPending || 
                            rejectTransferMutation.isPending || 
                            updateMaintenanceStatusMutation.isPending
                          }
                          className="flex-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 py-1.5 rounded-lg disabled:opacity-60 transition-colors cursor-pointer text-center"
                        >
                          {isTransfer 
                            ? (approveTransferMutation.isPending && approveTransferMutation.variables?.requestId === req.id ? "..." : "Approve")
                            : (updateMaintenanceStatusMutation.isPending && updateMaintenanceStatusMutation.variables?.requestId === req.id ? "..." : "Approve")
                          }
                        </button>
                        <button
                          onClick={() => {
                            setRejectingAction({
                              type: isTransfer ? "transfer" : "maintenance",
                              data: req
                            })
                          }}
                          disabled={
                            approveTransferMutation.isPending || 
                            rejectTransferMutation.isPending || 
                            updateMaintenanceStatusMutation.isPending
                          }
                          className="flex-1 text-xs font-semibold text-rose-600 hover:text-rose-500 bg-rose-50 hover:bg-rose-100/50 py-1.5 rounded-lg disabled:opacity-60 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {rejectingAction.type === "transfer" ? "Reject Transfer" : "Reject Maintenance"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Specify rejection reason</p>
              </div>
              <button 
                onClick={() => setRejectingAction(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Rejection Reason *</label>
                <textarea 
                  name="reason"
                  required
                  placeholder={
                    rejectingAction.type === "transfer"
                      ? "Why is this transfer request being rejected?"
                      : "Why is this maintenance request being rejected?"
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setRejectingAction(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={rejectTransferMutation.isPending || updateMaintenanceStatusMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 shadow-sm disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {rejectTransferMutation.isPending || updateMaintenanceStatusMutation.isPending ? "Confirming..." : "Confirm Reject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
