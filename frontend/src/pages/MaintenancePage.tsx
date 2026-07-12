import { useState, useEffect, type FormEvent } from "react"
import { useLocation } from "react-router-dom"
import { useCreateMaintenanceRequest, useUpdateMaintenanceStatus } from "@/hooks/mutations"
import { useMaintenanceRequests, useAssets, useEmployees } from "@/hooks/queries"
import type { MaintenancePriority, MaintenanceStatus, MaintenanceRequest } from "@/lib/database.types"
import { useAuthStore } from "@/stores/authStore"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Clock, Wrench, X } from "lucide-react"
import { cn } from "@/lib/utils"

const priorities: MaintenancePriority[] = ["low", "medium", "high", "critical"]

export function MaintenancePage() {
  const location = useLocation()
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  useEffect(() => {
    if (location.state?.openModal) {
      setIsRequestModalOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null)
  const [resolvingRequest, setResolvingRequest] = useState<any | null>(null)

  const profile = useAuthStore((state) => state.profile)
  const user = useAuthStore((state) => state.user)
  const isManagerOrAdmin = profile?.role === "admin" || profile?.role === "asset_manager"

  // Queries
  const { data: requests = [], isLoading: isLoadingRequests, error: requestsError } = useMaintenanceRequests()
  const { data: assetsData } = useAssets({ pageSize: 200 })
  const assets = assetsData?.data ?? []
  const { data: employees = [] } = useEmployees()

  // Mutations
  const createRequestMutation = useCreateMaintenanceRequest()
  const updateStatusMutation = useUpdateMaintenanceStatus()

  // Helpers
  const getPriorityColor = (priority: MaintenancePriority) => {
    switch (priority) {
      case "critical":
        return "bg-rose-50 text-rose-700 ring-rose-600/20"
      case "high":
        return "bg-amber-50 text-amber-700 ring-amber-600/20"
      case "medium":
        return "bg-blue-50 text-blue-700 ring-blue-600/20"
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20"
    }
  }

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      case "rejected":
        return "bg-rose-50 text-rose-700 ring-rose-600/20"
      case "in_progress":
        return "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
      case "assigned":
      case "approved":
        return "bg-blue-50 text-blue-700 ring-blue-600/20"
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20"
    }
  }

  async function handleRaiseRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) {
      toast.error("You must be logged in to raise a request.")
      return
    }

    const form = new FormData(event.currentTarget)
    const payload: Partial<MaintenanceRequest> = {
      asset_id: String(form.get("asset_id")),
      description: String(form.get("description")).trim(),
      priority: String(form.get("priority")) as MaintenancePriority,
      status: "pending",
      raised_by_id: user.id,
    }

    try {
      await createRequestMutation.mutateAsync(payload)
      toast.success("Maintenance request raised successfully!")
      setIsRequestModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to raise request")
    }
  }

  async function handleApprove(request: any) {
    try {
      await updateStatusMutation.mutateAsync({
        requestId: request.id,
        status: "approved",
        assetId: request.asset_id,
      })
      toast.success("Request approved and asset marked under maintenance.")
      if (selectedRequest?.id === request.id) {
        setSelectedRequest({ ...selectedRequest, status: "approved" })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve request")
    }
  }

  async function handleRejectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rejectingRequest) return

    const form = new FormData(event.currentTarget)
    const reason = String(form.get("reason")).trim()

    try {
      await updateStatusMutation.mutateAsync({
        requestId: rejectingRequest.id,
        status: "rejected",
        resolutionNotes: reason,
        assetId: rejectingRequest.asset_id,
      })
      toast.success("Request rejected.")
      setRejectingRequest(null)
      if (selectedRequest?.id === rejectingRequest.id) {
        setSelectedRequest({ ...selectedRequest, status: "rejected", resolution_notes: reason })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reject request")
    }
  }

  async function handleAssignTechnician(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return

    const form = new FormData(event.currentTarget)
    const technicianId = String(form.get("technician_id"))

    try {
      await updateStatusMutation.mutateAsync({
        requestId: selectedRequest.id,
        status: "assigned",
        assignedTechnicianId: technicianId,
      })
      toast.success("Technician assigned and status updated to assigned.")
      setSelectedRequest({ ...selectedRequest, status: "assigned", assigned_technician_id: technicianId })
    } catch (err: any) {
      toast.error(err.message || "Failed to assign technician")
    }
  }

  async function handleStartWork() {
    if (!selectedRequest) return
    try {
      await updateStatusMutation.mutateAsync({
        requestId: selectedRequest.id,
        status: "in_progress",
      })
      toast.success("Work started on request.")
      setSelectedRequest({ ...selectedRequest, status: "in_progress" })
    } catch (err: any) {
      toast.error(err.message || "Failed to start work")
    }
  }

  async function handleResolveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resolvingRequest) return

    const form = new FormData(event.currentTarget)
    const notes = String(form.get("notes")).trim()

    try {
      await updateStatusMutation.mutateAsync({
        requestId: resolvingRequest.id,
        status: "resolved",
        resolutionNotes: notes,
        assetId: resolvingRequest.asset_id,
      })
      toast.success("Request resolved and asset marked available.")
      setResolvingRequest(null)
      if (selectedRequest?.id === resolvingRequest.id) {
        setSelectedRequest({ ...selectedRequest, status: "resolved", resolution_notes: notes })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve request")
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Maintenance Queue</h1>
          <p className="text-sm text-slate-500 mt-2">Submit maintenance requests and coordinate repairs.</p>
        </div>
        
        <button 
          onClick={() => setIsRequestModalOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          <Wrench className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
          Raise Request
        </button>
      </div>

      {requestsError && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          Error loading maintenance queue: {requestsError.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left Side: Requests Queue */}
        <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Active Repair Queue
            </h2>
            <span className="text-xs font-semibold text-slate-500">{requests.length} Requests</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] flex-1">
            {isLoadingRequests ? (
              <div className="p-12 text-center text-slate-500">Loading requests...</div>
            ) : requests.length > 0 ? (
              requests.map((request) => (
                <div 
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={cn(
                    "p-5 cursor-pointer hover:bg-slate-50/50 transition-colors flex items-start gap-4",
                    selectedRequest?.id === request.id ? "bg-blue-50/40 border-l-4 border-blue-600 pl-4" : ""
                  )}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {request.asset?.name || "Unknown Asset"}
                      </span>
                      <span className="text-xs font-mono text-slate-400">({request.asset?.asset_tag})</span>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2">{request.description}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                      <span className="font-medium text-slate-600">By: {request.raised_by?.name || "User"}</span>
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", getStatusColor(request.status))}>
                      {request.status.replaceAll("_", " ")}
                    </span>
                    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", getPriorityColor(request.priority))}>
                      {request.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Queue is empty</h3>
                <p className="mt-1 text-slate-500">There are no pending or active repair requests.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Request Details */}
        <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 h-fit min-h-[400px] flex flex-col justify-between">
          {selectedRequest ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900">{selectedRequest.asset?.name}</h2>
                  <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset", getStatusColor(selectedRequest.status))}>
                    {selectedRequest.status.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">{selectedRequest.asset?.asset_tag}</div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</h4>
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</h4>
                    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset mt-1", getPriorityColor(selectedRequest.priority))}>
                      {selectedRequest.priority}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Raised Date</h4>
                    <p className="text-sm text-slate-700 mt-1">{new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Tech</h4>
                    <p className="text-sm text-slate-700 mt-1">
                      {employees.find(e => e.id === selectedRequest.assigned_technician_id)?.name || "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Raised By</h4>
                    <p className="text-sm text-slate-700 mt-1">{selectedRequest.raised_by?.name || "Employee"}</p>
                  </div>
                </div>

                {selectedRequest.resolution_notes && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {selectedRequest.status === "rejected" ? "Rejection Reason" : "Resolution Comments"}
                    </h4>
                    <p className="text-sm text-slate-700 mt-1">{selectedRequest.resolution_notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons based on roles and status */}
              {isManagerOrAdmin && (
                <div className="space-y-3 pt-6 border-t border-slate-100">
                  {selectedRequest.status === "pending" && (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleApprove(selectedRequest)}
                        disabled={updateStatusMutation.isPending}
                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition-colors shadow-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => setRejectingRequest(selectedRequest)}
                        className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {selectedRequest.status === "approved" && (
                    <form onSubmit={handleAssignTechnician} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign Technician</label>
                        <select 
                          name="technician_id" 
                          required 
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">-- Select Technician --</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        type="submit"
                        disabled={updateStatusMutation.isPending}
                        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-sm transition-colors"
                      >
                        Assign Tech
                      </button>
                    </form>
                  )}

                  {selectedRequest.status === "assigned" && (
                    <button 
                      onClick={handleStartWork}
                      disabled={updateStatusMutation.isPending}
                      className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-sm transition-colors"
                    >
                      Start Work (Mark In Progress)
                    </button>
                  )}

                  {(selectedRequest.status === "assigned" || selectedRequest.status === "in_progress") && (
                    <button 
                      onClick={() => setResolvingRequest(selectedRequest)}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-sm transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full flex-1 my-auto">
              <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-medium text-slate-900">No Request Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Select a repair request from the queue to view its history and perform status approvals.</p>
            </div>
          )}
        </section>
      </div>

      {/* Raise Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Raise Repair Request</h3>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRaiseRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Asset *</label>
                <select 
                  name="asset_id" 
                  required 
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Asset --</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name} ({asset.asset_tag})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority *</label>
                <select 
                  name="priority" 
                  required 
                  defaultValue="medium"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {priorities.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Description *</label>
                <textarea 
                  name="description" 
                  required 
                  placeholder="Explain what is broken or malfunctioning..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none h-28"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createRequestMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors"
                >
                  {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Request Dialog */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Reject Request</h3>
              <button 
                onClick={() => setRejectingRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Rejection *</label>
                <textarea 
                  name="reason" 
                  required 
                  placeholder="Explain why this request is being rejected..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 shadow-sm disabled:opacity-60 transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Request Dialog */}
      {resolvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Resolve Repair Request</h3>
              <button 
                onClick={() => setResolvingRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Resolution Notes *</label>
                <textarea 
                  name="notes" 
                  required 
                  placeholder="Explain what steps were taken to resolve this repair..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setResolvingRequest(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm disabled:opacity-60 transition-colors"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
