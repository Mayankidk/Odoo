import { useState, type FormEvent } from "react"
import { useAllocations, useTransferRequests, useAssets, useEmployees, useDepartments } from "@/hooks/queries"
import {
  useAllocateAsset,
  useReturnAsset,
  useCreateTransferRequest,
  useApproveTransferRequest,
  useRejectTransferRequest,
  useDirectTransferAsset,
} from "@/hooks/mutations"
import { useAuthStore } from "@/stores/authStore"
import { toast } from "sonner"
import {
  ArrowLeftRight,
  Package,
  RotateCcw,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Send,
  BadgeCheck,
  Ban,
  Shuffle,
} from "lucide-react"
import type { AllocationStatus, AssetCondition } from "@/lib/database.types"

const assetConditions: AssetCondition[] = ["new", "good", "fair", "poor", "damaged"]

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function isOverdue(expectedReturn: string | null, status: AllocationStatus) {
  if (!expectedReturn || status !== "active") return false
  return new Date(expectedReturn) < new Date()
}

type Tab = "active" | "history" | "transfers" | "my-assets"

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "active", label: "Active Allocations", icon: UserCheck },
  { id: "my-assets", label: "My Assets", icon: Package },
  { id: "transfers", label: "Transfer Requests", icon: ArrowLeftRight },
  { id: "history", label: "Return History", icon: RotateCcw },
]

const statusColors: Record<AllocationStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  returned: "bg-slate-50 text-slate-600 ring-slate-500/20",
  transferred: "bg-blue-50 text-blue-700 ring-blue-600/20",
  overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
}

const transferStatusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
}

export function AllocationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active")
  const [search, setSearch] = useState("")
  const [transferFilter, setTransferFilter] = useState<"" | "pending" | "approved" | "rejected">("")

  // Modals
  const [allocateModalAssetId, setAllocateModalAssetId] = useState<string | null>(null)
  const [returnModal, setReturnModal] = useState<{ allocationId: string; assetName: string } | null>(null)
  const [transferRequestModal, setTransferRequestModal] = useState<{ allocationId: string; assetName: string } | null>(null)
  const [rejectModal, setRejectModal] = useState<{ requestId: string } | null>(null)
  const [directTransferModal, setDirectTransferModal] = useState<{ allocationId: string; assetName: string; currentHolder: string } | null>(null)

  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const role = profile?.role
  const isManager = role === "admin" || role === "asset_manager"

  // Queries
  const allocationsQuery = useAllocations()
  const transfersQuery = useTransferRequests(transferFilter ? { status: transferFilter } : {})
  const availableAssetsQuery = useAssets({ status: "available", pageSize: 200 })
  const employeesQuery = useEmployees()
  const departmentsQuery = useDepartments()

  // Mutations
  const allocateMutation = useAllocateAsset()
  const returnMutation = useReturnAsset()
  const createTransferMutation = useCreateTransferRequest()
  const approveMutation = useApproveTransferRequest()
  const rejectMutation = useRejectTransferRequest()
  const directTransferMutation = useDirectTransferAsset()

  const allAllocations = allocationsQuery.data ?? []

  // Derived lists
  const activeAllocations = allAllocations.filter((a) => a.status === "active" || a.status === "overdue")
  const returnHistory = allAllocations.filter((a) => a.status === "returned" || a.status === "transferred")
  const myAssets = allAllocations.filter(
    (a) => a.status === "active" && a.allocated_to_user_id === user?.id
  )

  // Search helpers
  const filterAllocations = (list: typeof allAllocations) =>
    list.filter((a) => {
      const assetName = (a as any).asset?.name?.toLowerCase() ?? ""
      const assetTag = (a as any).asset?.asset_tag?.toLowerCase() ?? ""
      const holderName = (a as any).user?.name?.toLowerCase() ?? (a as any).department?.name?.toLowerCase() ?? ""
      const q = search.toLowerCase()
      return assetName.includes(q) || assetTag.includes(q) || holderName.includes(q)
    })

  // Handlers
  async function handleAllocate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allocateModalAssetId) return
    const form = new FormData(e.currentTarget)
    const type = String(form.get("holder_type"))
    const userId = type === "user" ? String(form.get("user_id")) : null
    const deptId = type === "department" ? String(form.get("department_id")) : null
    const expectedReturn = String(form.get("expected_return_date")) || null

    if (!userId && !deptId) { toast.error("Select an employee or department."); return }

    try {
      await allocateMutation.mutateAsync({ assetId: allocateModalAssetId, userId, departmentId: deptId, expectedReturnDate: expectedReturn })
      toast.success("Asset allocated successfully!")
      setAllocateModalAssetId(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  async function handleReturn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!returnModal) return
    const form = new FormData(e.currentTarget)
    try {
      await returnMutation.mutateAsync({
        allocationId: returnModal.allocationId,
        returnNotes: String(form.get("notes")) || undefined,
        conditionOnReturn: String(form.get("condition")) as AssetCondition || undefined,
      })
      toast.success("Asset returned successfully!")
      setReturnModal(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  async function handleTransferRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!transferRequestModal) return
    const form = new FormData(e.currentTarget)
    try {
      await createTransferMutation.mutateAsync({
        allocationId: transferRequestModal.allocationId,
        reason: String(form.get("reason")) || null,
      })
      toast.success("Transfer request submitted!")
      setTransferRequestModal(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  async function handleApprove(requestId: string) {
    try {
      await approveMutation.mutateAsync({ requestId })
      toast.success("Transfer approved and re-allocated!")
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  async function handleReject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!rejectModal) return
    const form = new FormData(e.currentTarget)
    const reason = String(form.get("reason") ?? "").trim()
    if (!reason) { toast.error("Please provide a rejection reason."); return }
    try {
      await rejectMutation.mutateAsync({ requestId: rejectModal.requestId, rejectionReason: reason })
      toast.success("Transfer request rejected.")
      setRejectModal(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  async function handleDirectTransfer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!directTransferModal) return
    const form = new FormData(e.currentTarget)
    const type = String(form.get("holder_type"))
    const toUserId = type === "user" ? String(form.get("to_user_id")) || null : null
    const toDeptId = type === "department" ? String(form.get("to_department_id")) || null : null
    const expectedReturn = String(form.get("expected_return_date")) || null
    const notes = String(form.get("notes")) || null
    if (!toUserId && !toDeptId) { toast.error("Select an employee or department."); return }
    try {
      await directTransferMutation.mutateAsync({
        allocationId: directTransferModal.allocationId,
        toUserId,
        toDepartmentId: toDeptId,
        expectedReturnDate: expectedReturn,
        notes,
      })
      toast.success("Asset transferred successfully!")
      setDirectTransferModal(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const displayedAllocations = filterAllocations(
    activeTab === "active" ? activeAllocations : returnHistory
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Allocation & Transfer</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Manage asset allocations, returns, and transfer requests.
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setAllocateModalAssetId("__pick__")}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            Allocate Asset
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Allocations", value: activeAllocations.length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "My Assets", value: myAssets.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Transfers", value: (transfersQuery.data ?? []).filter((t) => t.status === "pending").length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Overdue Returns", value: activeAllocations.filter((a) => isOverdue(a.expected_return_date, a.status)).length, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${stat.bg} mb-3`}>
              <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch("") }}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {(activeTab === "active" || activeTab === "history") && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search asset, tag or holder..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Holder</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Allocated On</th>
                    <th className="px-6 py-4">Expected Return</th>
                    {activeTab === "active" && <th className="px-6 py-4 text-right">Actions</th>}
                    {activeTab === "history" && <th className="px-6 py-4">Returned On</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocationsQuery.isLoading ? (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={6}>Loading...</td></tr>
                  ) : displayedAllocations.length === 0 ? (
                    <tr><td className="px-6 py-10 text-center text-slate-400" colSpan={6}>
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-slate-300" />
                        <span>No allocations found.</span>
                      </div>
                    </td></tr>
                  ) : displayedAllocations.map((alloc) => {
                    const overdue = isOverdue(alloc.expected_return_date, alloc.status)
                    const effectiveStatus = overdue ? "overdue" : alloc.status
                    const holderName = (alloc as any).user?.name ?? (alloc as any).department?.name ?? "—"
                    return (
                      <tr key={alloc.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{(alloc as any).asset?.name ?? "—"}</div>
                          <div className="text-xs text-slate-400 font-mono">{(alloc as any).asset?.asset_tag ?? ""}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{holderName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[effectiveStatus as AllocationStatus] ?? ""}`}>
                            {overdue && <AlertTriangle className="w-3 h-3" />}
                            {effectiveStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{formatDate(alloc.created_at)}</td>
                        <td className={`px-6 py-4 font-medium ${overdue ? "text-rose-600" : "text-slate-600"}`}>
                          {formatDate(alloc.expected_return_date)}
                        </td>
                        {activeTab === "active" && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              {isManager && (
                                <>
                                  <button
                                    onClick={() => setReturnModal({ allocationId: alloc.id, assetName: (alloc as any).asset?.name ?? "Asset" })}
                                    className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                  >
                                    Return
                                  </button>
                                  <button
                                    onClick={() => setDirectTransferModal({ allocationId: alloc.id, assetName: (alloc as any).asset?.name ?? "Asset", currentHolder: holderName })}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                  >
                                    <Shuffle className="w-3 h-3" /> Transfer
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setTransferRequestModal({ allocationId: alloc.id, assetName: (alloc as any).asset?.name ?? "Asset" })}
                                className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                Request Transfer
                              </button>
                            </div>
                          </td>
                        )}
                        {activeTab === "history" && (
                          <td className="px-6 py-4 text-slate-500">{formatDate(alloc.actual_return_date)}</td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* My Assets tab */}
      {activeTab === "my-assets" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-700">Assets currently assigned to you</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Allocated On</th>
                  <th className="px-6 py-4">Expected Return</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myAssets.length === 0 ? (
                  <tr><td className="px-6 py-10 text-center text-slate-400" colSpan={5}>
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-slate-300" />
                      <span>No assets assigned to you yet.</span>
                    </div>
                  </td></tr>
                ) : myAssets.map((alloc) => {
                  const overdue = isOverdue(alloc.expected_return_date, alloc.status)
                  return (
                    <tr key={alloc.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{(alloc as any).asset?.name ?? "—"}</div>
                        <div className="text-xs font-mono text-slate-400">{(alloc as any).asset?.asset_tag}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                          Active
                        </span>
                        {overdue && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-rose-50 text-rose-700 ring-rose-600/20">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(alloc.created_at)}</td>
                      <td className={`px-6 py-4 font-medium ${overdue ? "text-rose-600" : "text-slate-600"}`}>
                        {formatDate(alloc.expected_return_date)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setTransferRequestModal({ allocationId: alloc.id, assetName: (alloc as any).asset?.name ?? "Asset" })}
                          className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Request Transfer
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Requests tab */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex gap-2">
              {(["", "pending", "approved", "rejected"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTransferFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    transferFilter === f
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Current Holder</th>
                    <th className="px-6 py-4">Requested By</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    {isManager && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfersQuery.isLoading ? (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={7}>Loading...</td></tr>
                  ) : (transfersQuery.data ?? []).length === 0 ? (
                    <tr><td className="px-6 py-10 text-center text-slate-400" colSpan={7}>
                      <div className="flex flex-col items-center gap-2">
                        <ArrowLeftRight className="w-8 h-8 text-slate-300" />
                        <span>No transfer requests found.</span>
                      </div>
                    </td></tr>
                  ) : (transfersQuery.data ?? []).map((tr) => {
                    const assetName = tr.allocation?.asset?.name ?? "—"
                    const assetTag = tr.allocation?.asset?.asset_tag ?? ""
                    const holderName = tr.allocation?.holder?.name ?? tr.allocation?.holder_dept?.name ?? "—"
                    const requestedBy = tr.requested_by?.name ?? tr.requested_by?.email ?? "—"
                    return (
                      <tr key={tr.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{assetName}</div>
                          <div className="text-xs font-mono text-slate-400">{assetTag}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{holderName}</td>
                        <td className="px-6 py-4 text-slate-700">{requestedBy}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-[200px]">
                          <span className="line-clamp-2">{tr.reason ?? "—"}</span>
                          {tr.rejection_reason && (
                            <span className="block text-xs text-rose-600 mt-0.5">Rejected: {tr.rejection_reason}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${transferStatusColors[tr.status]}`}>
                            {tr.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                            {tr.status === "approved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {tr.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                            {tr.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{formatDate(tr.created_at)}</td>
                        {isManager && (
                          <td className="px-6 py-4 text-right">
                            {tr.status === "pending" && (
                              <div className="flex justify-end gap-2">
                                <button
                                  disabled={approveMutation.isPending}
                                  onClick={() => handleApprove(tr.id)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                                >
                                  <BadgeCheck className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectModal({ requestId: tr.id })}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                >
                                  <Ban className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Allocate Modal */}
      {allocateModalAssetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-500" /> Allocate Asset
              </h2>
              <p className="text-xs text-slate-500 mt-1">Assign an available asset to an employee or department.</p>
            </div>
            <form onSubmit={handleAllocate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset *</label>
                <select
                  required
                  value={allocateModalAssetId === "__pick__" ? "" : allocateModalAssetId}
                  onChange={(e) => setAllocateModalAssetId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select available asset...</option>
                  {(availableAssetsQuery.data?.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.asset_tag})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To *</label>
                <select name="holder_type" defaultValue="user" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="user">Employee</option>
                  <option value="department">Department</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
                <select name="user_id" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Select employee...</option>
                  {(employeesQuery.data ?? []).map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select name="department_id" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Select department...</option>
                  {(departmentsQuery.data ?? []).filter((d) => d.status === "active").map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Return Date</label>
                <input type="date" name="expected_return_date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAllocateModalAssetId(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={allocateMutation.isPending} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition-colors">
                  {allocateMutation.isPending ? "Allocating..." : "Allocate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-500" /> Return Asset
              </h2>
              <p className="text-xs text-slate-500 mt-1">Returning: <strong>{returnModal.assetName}</strong></p>
            </div>
            <form onSubmit={handleReturn} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition on Return *</label>
                <select name="condition" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {assetConditions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Return Notes</label>
                <textarea name="notes" rows={3} placeholder="Any damage, notes, or observations..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReturnModal(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={returnMutation.isPending} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors">
                  {returnMutation.isPending ? "Processing..." : "Confirm Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Request Modal */}
      {transferRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-500" /> Request Transfer
              </h2>
              <p className="text-xs text-slate-500 mt-1">Requesting transfer of: <strong>{transferRequestModal.assetName}</strong></p>
            </div>
            <form onSubmit={handleTransferRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Transfer</label>
                <textarea name="reason" rows={3} placeholder="Why do you need this asset transferred to you?" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
              </div>
              <p className="text-xs text-slate-400">A manager will review and approve this request.</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setTransferRequestModal(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={createTransferMutation.isPending} className="flex-1 rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60 transition-colors">
                  {createTransferMutation.isPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" /> Reject Transfer Request
              </h2>
            </div>
            <form onSubmit={handleReject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason *</label>
                <textarea name="reason" required rows={3} placeholder="Explain why this transfer is being rejected..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRejectModal(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={rejectMutation.isPending} className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60 transition-colors">
                  {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Transfer Modal */}
      {directTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-indigo-500" /> Direct Transfer
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Transferring: <strong>{directTransferModal.assetName}</strong>
                <span className="ml-1 text-slate-400">from <em>{directTransferModal.currentHolder}</em></span>
              </p>
            </div>
            <form onSubmit={handleDirectTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To *</label>
                <select name="holder_type" defaultValue="user" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="user">Employee</option>
                  <option value="department">Department</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
                <select name="to_user_id" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Select employee...</option>
                  {(employeesQuery.data ?? []).map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select name="to_department_id" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Select department...</option>
                  {(departmentsQuery.data ?? []).filter((d) => d.status === "active").map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Return Date</label>
                <input type="date" name="expected_return_date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Notes</label>
                <textarea name="notes" rows={2} placeholder="Reason for transfer or any handover notes..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setDirectTransferModal(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={directTransferMutation.isPending} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors">
                  {directTransferMutation.isPending ? "Transferring..." : "Transfer Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
