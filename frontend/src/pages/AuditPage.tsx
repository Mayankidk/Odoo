import { useState, type FormEvent } from "react"
import { useAuditCycles, useAuditItems, useAssets, useDepartments, useEmployees } from "@/hooks/queries"
import { useCreateAuditCycle, useUpdateAuditItem, useCloseAuditCycle } from "@/hooks/mutations"
import type { AuditVerificationStatus } from "@/lib/database.types"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { throwIfError } from "@/lib/errors"
import { toast } from "sonner"
import { 
  ClipboardCheck, 
  Plus, 
  Calendar, 
  X,
  AlertTriangle,
  Download,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"

export function AuditPage() {
  const [selectedCycle, setSelectedCycle] = useState<any | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [verifyingItem, setVerifyingItem] = useState<any | null>(null)
  const [itemFilter, setItemFilter] = useState<string>("all")
  const [scopeType, setScopeType] = useState<"department" | "location">("department")
  const [selectedAuditorIds, setSelectedAuditorIds] = useState<string[]>([])
  const [showDiscrepancy, setShowDiscrepancy] = useState(false)

  const profile = useAuthStore((state) => state.profile)
  const user = useAuthStore((state) => state.user)
  const isManagerOrAdmin = profile?.role === "admin" || profile?.role === "asset_manager"

  // Queries
  const { data: cycles = [], isLoading: isLoadingCycles, error: cyclesError } = useAuditCycles()
  const { data: auditItems = [], isLoading: isLoadingItems } = useAuditItems(selectedCycle?.id)
  const { data: assetsData } = useAssets({ pageSize: 1000 })
  const assets = assetsData?.data ?? []
  const { data: departments = [] } = useDepartments()
  const { data: employees = [] } = useEmployees()

  // Mutations
  const createCycleMutation = useCreateAuditCycle()
  const updateItemMutation = useUpdateAuditItem()
  const closeCycleMutation = useCloseAuditCycle()

  // Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed":
        return "bg-slate-50 text-slate-700 ring-slate-600/20"
      case "active":
        return "bg-blue-50 text-blue-700 ring-blue-600/20"
      default:
        return "bg-amber-50 text-amber-700 ring-amber-600/20"
    }
  }

  const getItemStatusColor = (status: AuditVerificationStatus) => {
    switch (status) {
      case "verified":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      case "damaged":
        return "bg-amber-50 text-amber-700 ring-amber-600/20"
      case "missing":
        return "bg-rose-50 text-rose-700 ring-rose-600/20"
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20"
    }
  }

  function handleAuditorToggle(id: string) {
    setSelectedAuditorIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleExportDiscrepancyReport() {
    const flagged = auditItems.filter((i: any) => i.verification_status === "missing" || i.verification_status === "damaged")
    if (!flagged.length) {
      toast.info("No discrepancies to export.")
      return
    }
    const rows = [
      ["Asset Tag", "Asset Name", "Status", "Auditor Notes"],
      ...flagged.map((i: any) => [
        i.asset?.asset_tag ?? "",
        i.asset?.name ?? "",
        i.verification_status,
        (i.notes ?? "").replace(/,/g, ";"),
      ])
    ]
    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `discrepancy_report_${selectedCycle?.name?.replace(/\s+/g, "_") ?? "audit"}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Discrepancy report exported!")
  }

  async function handleCreateCycle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    const form = new FormData(event.currentTarget)
    const type = form.get("scope_type") as "department" | "location"
    const deptId = form.get("scope_id") ? String(form.get("scope_id")) : null
    const location = form.get("scope_location") ? String(form.get("scope_location")).trim() : null

    const payload: any = {
      name: String(form.get("name")).trim(),
      scope_type: type,
      scope_id: type === "department" ? deptId : null,
      scope_location: type === "location" ? location : null,
      start_date: String(form.get("start_date")),
      end_date: String(form.get("end_date")),
      status: "planned" as any,
      created_by_id: user.id,
      auditor_ids: selectedAuditorIds.length > 0 ? selectedAuditorIds : null,
    }

    try {
      const newCycle = await createCycleMutation.mutateAsync(payload)
      toast.success("Audit cycle scheduled successfully!")

      // Filter assets based on scope
      let filteredAssets = assets.filter(
        (asset) => asset.status !== "retired" && asset.status !== "disposed"
      )

      if (type === "department" && deptId) {
        filteredAssets = filteredAssets.filter((asset) => asset.department_id === deptId)
      } else if (type === "location" && location) {
        filteredAssets = filteredAssets.filter(
          (asset) => asset.location?.toLowerCase() === location.toLowerCase()
        )
      }

      if (filteredAssets.length > 0) {
        const itemsToInsert = filteredAssets.map((asset) => ({
          audit_cycle_id: newCycle.id,
          asset_id: asset.id,
          verification_status: "pending" as AuditVerificationStatus,
        }))

        const { error } = await supabase.from("audit_items").insert(itemsToInsert)
        throwIfError(error)
        toast.success(`Registered ${filteredAssets.length} assets for auditing.`)
      } else {
        toast.warning("No active assets found matching this cycle's scope.")
      }

      setIsCreateModalOpen(false)
      setSelectedAuditorIds([])
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule audit cycle")
    }
  }

  async function handleActivateCycle(cycleId: string) {
    try {
      const { error } = await supabase
        .from("audit_cycles")
        .update({ status: "active" as any })
        .eq("id", cycleId)

      throwIfError(error)
      toast.success("Audit cycle is now active!")
      if (selectedCycle?.id === cycleId) {
        setSelectedCycle({ ...selectedCycle, status: "active" })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to activate cycle")
    }
  }

  async function handleCloseCycle(cycleId: string) {
    if (!confirm("Are you sure you want to close this audit cycle? This will lock all verified records and automatically set missing assets to 'lost'.")) {
      return
    }

    try {
      await closeCycleMutation.mutateAsync(cycleId)
      toast.success("Audit cycle closed and missing assets marked as lost.")
      if (selectedCycle?.id === cycleId) {
        setSelectedCycle({ ...selectedCycle, status: "closed" })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to close audit cycle")
    }
  }

  async function handleVerifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!verifyingItem || !user) return

    const form = new FormData(event.currentTarget)
    const status = String(form.get("status")) as AuditVerificationStatus
    const notes = String(form.get("notes")).trim()

    try {
      await updateItemMutation.mutateAsync({
        auditItemId: verifyingItem.id,
        values: {
          verification_status: status,
          notes: notes || null,
          verified_by_id: user.id,
        },
      })
      toast.success("Asset verification updated.")
      setVerifyingItem(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to update item status")
    }
  }

  const filteredItems = auditItems.filter((item) => {
    if (itemFilter === "all") return true
    return item.verification_status === itemFilter
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Asset Audits</h1>
          <p className="text-sm text-slate-500 mt-2">Manage scheduled physical audit cycles and check conditions.</p>
        </div>

        {isManagerOrAdmin && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            <Plus className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
            Schedule Audit
          </button>
        )}
      </div>

      {cyclesError && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          Error loading audit cycles: {cyclesError.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left Column: Cycles Queue */}
        <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-500" />
              Audit Cycles History
            </h2>
            <span className="text-xs font-semibold text-slate-500">{cycles.length} Cycles</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] flex-1">
            {isLoadingCycles ? (
              <div className="p-12 text-center text-slate-500">Loading cycles...</div>
            ) : cycles.length > 0 ? (
              cycles.map((cycle) => (
                <div 
                  key={cycle.id}
                  onClick={() => setSelectedCycle(cycle)}
                  className={cn(
                    "p-5 cursor-pointer hover:bg-slate-50/50 transition-colors flex items-start gap-4",
                    selectedCycle?.id === cycle.id ? "bg-blue-50/40 border-l-4 border-blue-600 pl-4" : ""
                  )}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {cycle.name}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      Scope: {cycle.scope_type === "department" 
                        ? `Department (${departments.find(d => d.id === cycle.scope_id)?.name || "Unknown"})`
                        : `Location (${cycle.scope_location})`}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(cycle.start_date).toLocaleDateString()} – {new Date(cycle.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset flex-shrink-0", getStatusColor(cycle.status))}>
                    {cycle.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                <ClipboardCheck className="w-12 h-12 text-slate-300 mb-2" />
                <h3 className="text-base font-semibold text-slate-900">No Audits Scheduled</h3>
                <p className="text-xs text-slate-500 mt-1">Schedule audit cycles to physically verify inventory.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Cycle Details and Items Checklist */}
        <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 h-fit min-h-[500px] flex flex-col justify-between">
          {selectedCycle ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900">{selectedCycle.name}</h2>
                  <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset", getStatusColor(selectedCycle.status))}>
                    {selectedCycle.status}
                  </span>
                </div>
                
                <div className="text-xs text-slate-500 mt-2">
                  Scope: {selectedCycle.scope_type === "department" 
                    ? `Department (${departments.find(d => d.id === selectedCycle.scope_id)?.name || "Unknown"})`
                    : `Location (${selectedCycle.scope_location})`}
                </div>

                {/* Assigned Auditors */}
                {selectedCycle.auditor_ids?.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" /> Auditors:</span>
                    {selectedCycle.auditor_ids.map((aid: string) => {
                      const emp = (employees as any[]).find((e: any) => e.id === aid)
                      return emp ? (
                        <span key={aid} className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-700/10 px-2 py-0.5 text-[10px] font-medium">
                          {emp.name}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(selectedCycle.start_date).toLocaleDateString()} – {new Date(selectedCycle.end_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {isManagerOrAdmin && selectedCycle.status !== "closed" && (
                    <>
                      {selectedCycle.status === "planned" && (
                        <button 
                          onClick={() => handleActivateCycle(selectedCycle.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm transition-colors"
                        >
                          Start Audit Cycle
                        </button>
                      )}
                      {selectedCycle.status === "active" && (
                        <button 
                          onClick={() => handleCloseCycle(selectedCycle.id)}
                          disabled={closeCycleMutation.isPending}
                          className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 shadow-sm transition-colors"
                        >
                          Close & Lock Audit
                        </button>
                      )}
                    </>
                  )}
                  {selectedCycle.status === "closed" && (
                    <button
                      onClick={() => setShowDiscrepancy(v => !v)}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 shadow-sm transition-colors flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {showDiscrepancy ? "Hide" : "View"} Discrepancy Report
                    </button>
                  )}
                </div>

                {/* Discrepancy Report */}
                {showDiscrepancy && selectedCycle.status === "closed" && (() => {
                  const flagged = auditItems.filter((i: any) => i.verification_status === "missing" || i.verification_status === "damaged")
                  return (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Discrepancy Report ({flagged.length} items)
                        </h4>
                        <button
                          onClick={handleExportDiscrepancyReport}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-white border border-amber-200 rounded-lg px-2.5 py-1 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Export CSV
                        </button>
                      </div>
                      {flagged.length === 0 ? (
                        <p className="text-xs text-amber-700 italic">No discrepancies found — all assets verified!</p>
                      ) : (
                        <div className="divide-y divide-amber-200/70">
                          {flagged.map((i: any) => (
                            <div key={i.id} className="py-2.5 flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs font-semibold text-slate-900">{i.asset?.name ?? "Unknown"}</div>
                                <div className="text-[10px] font-mono text-slate-400">{i.asset?.asset_tag}</div>
                                {i.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{i.notes}</p>}
                              </div>
                              <span className={cn(
                                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset flex-shrink-0",
                                i.verification_status === "missing" ? "bg-rose-50 text-rose-700 ring-rose-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20"
                              )}>
                                {i.verification_status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Items List inside selected cycle */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-700">Verification Checklist</h3>
                  <select 
                    value={itemFilter}
                    onChange={(e) => setItemFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="all">All Items</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="missing">Missing</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>

                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[350px] border border-slate-100 rounded-xl">
                  {isLoadingItems ? (
                    <div className="p-8 text-center text-xs text-slate-500">Loading audit list...</div>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          if (selectedCycle.status === "active") {
                            setVerifyingItem(item)
                          } else {
                            toast.info("Verifications can only be updated when cycle is 'active'.")
                          }
                        }}
                        className={cn(
                          "p-3.5 flex items-start justify-between gap-3 text-sm cursor-pointer",
                          selectedCycle.status === "active" ? "hover:bg-slate-50" : "cursor-default"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900 text-xs">
                            {item.asset?.name || "Unknown Asset"}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">({item.asset?.asset_tag})</div>
                          {item.notes && (
                            <p className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1 max-w-[240px] italic">
                              "{item.notes}"
                            </p>
                          )}
                        </div>

                        <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset flex-shrink-0", getItemStatusColor(item.verification_status))}>
                          {item.verification_status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">No items match selection.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full flex-1 my-auto">
              <ClipboardCheck className="w-10 h-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-medium text-slate-900">No Cycle Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Select an audit cycle from the history to manage verification lists.</p>
            </div>
          )}
        </section>
      </div>

      {/* Create Audit Cycle Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Schedule Inventory Audit</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCycle} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Audit Cycle Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="e.g. Q3 IT Hardware Audit"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Scope Type *</label>
                <select 
                  name="scope_type" 
                  required 
                  value={scopeType}
                  onChange={(e) => setScopeType(e.target.value as "department" | "location")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="department">By Department</option>
                  <option value="location">By Location</option>
                </select>
              </div>

              {scopeType === "department" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Department *</label>
                  <select 
                    name="scope_id" 
                    required 
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Location Name *</label>
                  <input 
                    type="text" 
                    name="scope_location" 
                    required 
                    placeholder="e.g. Floor 2, Main Office"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date *</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    required 
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date *</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    required 
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign Auditors</label>
                <p className="text-xs text-slate-400 mb-2">Select one or more employees to conduct this audit.</p>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 divide-y divide-slate-100">
                  {(employees as any[]).map((emp: any) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAuditorIds.includes(emp.id)}
                        onChange={() => handleAuditorToggle(emp.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">{emp.name}</div>
                        <div className="text-xs text-slate-400">{emp.role?.replace("_", " ")}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedAuditorIds.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">{selectedAuditorIds.length} auditor(s) selected</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createCycleMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors"
                >
                  {createCycleMutation.isPending ? "Creating..." : "Schedule Cycle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Item Modal */}
      {verifyingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Verify Asset Conditions</h3>
              <button 
                onClick={() => setVerifyingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleVerifySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Asset</label>
                <div className="text-sm font-bold text-slate-800">{verifyingItem.asset?.name} ({verifyingItem.asset?.asset_tag})</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Status *</label>
                <select 
                  name="status" 
                  required 
                  defaultValue={verifyingItem.verification_status}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="verified">Verified (Active & Correct)</option>
                  <option value="damaged">Damaged (Requires Maintenance)</option>
                  <option value="missing">Missing (Not Found)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Auditor Remarks</label>
                <textarea 
                  name="notes" 
                  defaultValue={verifyingItem.notes ?? ""}
                  placeholder="Explain condition checks or location specifics..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setVerifyingItem(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateItemMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors"
                >
                  {updateItemMutation.isPending ? "Saving..." : "Save Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
