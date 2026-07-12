import { useState, type FormEvent } from "react"
import { useRegisterAsset, useAllocateAsset, useReturnAsset, useCreateTransferRequest } from "@/hooks/mutations"
import { useAssets, useCategories, useDepartments, useEmployees } from "@/hooks/queries"
import type { Asset, AssetCondition, AssetStatus } from "@/lib/database.types"
import { useAuthStore } from "@/stores/authStore"
import { toast } from "sonner"
import { Package, X } from "lucide-react"

const assetConditions: AssetCondition[] = ["new", "good", "fair", "poor", "damaged"]
const assetStatuses: AssetStatus[] = ["available", "allocated", "reserved", "under_maintenance", "lost", "retired", "disposed"]

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

export function AssetsPage() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Modals state
  const [allocateAsset, setAllocateAsset] = useState<Asset | null>(null)
  const [returnAsset, setReturnAsset] = useState<{ asset: Asset; allocationId: string } | null>(null)
  const [registerCategoryId, setRegisterCategoryId] = useState("")
  const [transferAllocation, setTransferAllocation] = useState<any | null>(null)

  const user = useAuthStore((state) => state.user)
  
  // Queries
  const assetsQuery = useAssets({
    search: search || undefined,
    categoryId: selectedCategory || undefined,
    status: (selectedStatus as AssetStatus) || undefined,
    departmentId: selectedDepartment || undefined,
    page,
    pageSize,
  })
  
  const categories = useCategories()
  const departments = useDepartments()
  const employees = useEmployees()

  // Mutations
  const registerAssetMutation = useRegisterAsset()
  const allocateAssetMutation = useAllocateAsset()
  const returnAssetMutation = useReturnAsset()
  const createTransferMutation = useCreateTransferRequest()

  // Let's create a helper to handle allocation return.
  const handleReturnClick = async (asset: Asset) => {
    // To return an asset, we need its active allocation ID.
    // Let's query public.allocations table where asset_id = asset.id and status = 'active'
    const { supabase } = await import("@/lib/supabase")
    const { data, error } = await supabase
      .from("allocations")
      .select("id")
      .eq("asset_id", asset.id)
      .eq("status", "active")
      .single()

    if (error || !data) {
      toast.error("Could not find an active allocation for this asset.")
      return
    }

    setReturnAsset({ asset, allocationId: data.id })
  }

  const handleTransferClick = async (asset: Asset) => {
    const { supabase } = await import("@/lib/supabase")
    const { data, error } = await supabase
      .from("allocations")
      .select(`
        id,
        asset_id,
        allocated_to_user_id,
        allocated_to_dept_id,
        user:users!allocations_allocated_to_user_id_fkey(name),
        department:departments!allocations_allocated_to_dept_id_fkey(name)
      `)
      .eq("asset_id", asset.id)
      .eq("status", "active")
      .single()

    if (error || !data) {
      toast.error("Could not find an active allocation for this asset.")
      return
    }

    setTransferAllocation({
      ...data,
      asset,
    })
  }

  async function handleRegisterAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      toast.error("You need to be signed in to register an asset.")
      return
    }

    const form = new FormData(event.currentTarget)
    const acquisitionCost = String(form.get("acquisition_cost") || "")
    
    // Dynamic Custom Fields mapping
    const selectedRegCat = categories.data?.find((c) => c.id === registerCategoryId)
    const customFieldsSchema = selectedRegCat?.custom_fields_schema as Record<string, { type?: string; label?: string }> | undefined
    const customFields: Record<string, any> = {}
    if (customFieldsSchema) {
      for (const [key, def] of Object.entries(customFieldsSchema) as any) {
        const val = form.get(`custom_fields_${key}`)
        if (val !== null && val !== "") {
          customFields[key] = def?.type === "number" ? Number(val) : val
        }
      }
    }

    const payload: Partial<Asset> = {
      name: String(form.get("name") ?? "").trim(),
      category_id: registerCategoryId,
      serial_number: String(form.get("serial_number") || "") || null,
      acquisition_date: String(form.get("acquisition_date") || "") || null,
      acquisition_cost: acquisitionCost ? Number(acquisitionCost) : null,
      condition: String(form.get("condition") ?? "good") as AssetCondition,
      location: String(form.get("location") || "") || null,
      department_id: String(form.get("department_id") || "") || null,
      is_bookable: form.get("is_bookable") === "on",
      registered_by: user.id,
      custom_fields: customFields,
      status: "available",
    }

    try {
      await registerAssetMutation.mutateAsync(payload)
      event.currentTarget.reset()
      setRegisterCategoryId("")
      toast.success("Asset registered successfully!")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleAllocateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!allocateAsset) return

    const form = new FormData(event.currentTarget)
    const type = String(form.get("type"))
    const userId = type === "user" ? String(form.get("user_id")) : null
    const deptId = type === "department" ? String(form.get("department_id")) : null
    const expectedReturnDate = String(form.get("expected_return_date")) || null

    if (!userId && !deptId) {
      toast.error("Please select an employee or department.")
      return
    }

    try {
      await allocateAssetMutation.mutateAsync({
        assetId: allocateAsset.id,
        userId,
        departmentId: deptId,
        expectedReturnDate,
      })
      toast.success(`Asset allocated successfully!`)
      setAllocateAsset(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleReturnSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!returnAsset) return

    const form = new FormData(event.currentTarget)
    const returnNotes = String(form.get("return_notes") || "")
    const conditionOnReturn = String(form.get("condition_on_return")) as AssetCondition

    try {
      await returnAssetMutation.mutateAsync({
        allocationId: returnAsset.allocationId,
        returnNotes,
        conditionOnReturn,
      })
      toast.success("Asset returned and marked as available.")
      setReturnAsset(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!transferAllocation) return

    const form = new FormData(event.currentTarget)
    const reason = String(form.get("reason")).trim()

    try {
      await createTransferMutation.mutateAsync({
        allocationId: transferAllocation.id,
        reason: reason || null,
      })
      toast.success("Transfer request submitted successfully!")
      setTransferAllocation(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }


  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      case "allocated":
        return "bg-blue-50 text-blue-700 ring-blue-600/20"
      case "reserved":
        return "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
      case "under_maintenance":
        return "bg-amber-50 text-amber-700 ring-amber-600/20"
      case "lost":
        return "bg-rose-50 text-rose-700 ring-rose-600/20"
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20"
    }
  }

  const totalCount = assetsQuery.data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Asset Management</h1>
        <p className="text-sm text-slate-500 mt-2">Register assets, track their status, and manage allocations.</p>
      </div>

      {/* Filter and Table Section */}
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by asset name..."
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.data?.filter(c => c.status === "active").map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {assetStatuses.map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
            <select
              value={selectedDepartment}
              onChange={(e) => { setSelectedDepartment(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.data?.filter(d => d.status === "active").map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Asset Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Bookable</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetsQuery.isLoading ? (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={6}>Loading assets...</td></tr>
                  ) : assetsQuery.data?.data.length ? (
                    assetsQuery.data.data.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{asset.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{asset.asset_tag}</div>
                          {asset.custom_fields && Object.keys(asset.custom_fields).length > 0 && (
                            <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap gap-1">
                              {Object.entries(asset.custom_fields).map(([key, val]: [string, any]) => (
                                <span key={key} className="bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded text-[10px] border border-slate-200/50">
                                  <strong className="font-semibold capitalize">{key.replace(/_/g, " ")}:</strong> {String(val)}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {/* @ts-ignore */}
                          {asset.category?.name ?? "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(asset.status)}`}>
                            {asset.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{asset.location ?? "-"}</td>
                        <td className="px-6 py-4 text-slate-600">{asset.is_bookable ? "Yes" : "No"}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {asset.status === "available" && (
                            <button 
                              onClick={() => setAllocateAsset(asset)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100/50 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              Allocate
                            </button>
                          )}
                          {asset.status === "allocated" && (
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleReturnClick(asset)}
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 bg-emerald-50 hover:bg-emerald-100/50 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                Return
                              </button>
                              <button 
                                onClick={() => handleTransferClick(asset)}
                                className="text-xs font-semibold text-purple-600 hover:text-purple-500 bg-purple-50 hover:bg-purple-100/50 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                Transfer
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={6}>No assets found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!assetsQuery.isLoading && totalCount > pageSize && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{(page - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-semibold text-slate-900">
                    {Math.min(page * pageSize, totalCount)}
                  </span>{" "}
                  of <span className="font-semibold text-slate-900">{totalCount}</span> assets
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Registration Form Panel */}
        <form onSubmit={handleRegisterAsset} className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm h-fit">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Register New Asset
            </h2>
            <p className="text-xs text-slate-500 mt-1">Add a new physical asset to the directory.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Name *</label>
              <input 
                name="name" 
                required 
                placeholder="e.g. Dell XPS 15 Laptop"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select 
                name="category_id" 
                required 
                value={registerCategoryId}
                onChange={(e) => setRegisterCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select category</option>
                {categories.data?.filter((c) => c.status === "active").map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Custom Fields */}
            {(() => {
              const selectedRegCat = categories.data?.find((c) => c.id === registerCategoryId);
              const customFieldsSchema = selectedRegCat?.custom_fields_schema as Record<string, { type?: string; label?: string }> | undefined;
              if (!customFieldsSchema || Object.keys(customFieldsSchema).length === 0) return null;

              return (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category Custom Fields</h3>
                  {Object.entries(customFieldsSchema).map(([key, def]: [string, any]) => {
                    const type = def?.type === "number" ? "number" : def?.type === "date" ? "date" : "text";
                    const label = def?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
                        <input 
                          name={`custom_fields_${key}`} 
                          type={type}
                          placeholder={`Enter ${label.toLowerCase()}...`}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" 
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number</label>
                <input 
                  name="serial_number" 
                  placeholder="e.g. SN-998822"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition *</label>
                <select 
                  name="condition" 
                  defaultValue="good" 
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {assetConditions.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Acquisition Date</label>
                <input 
                  name="acquisition_date" 
                  type="date" 
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cost</label>
                <input 
                  name="acquisition_cost" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owning Department</label>
              <select 
                name="department_id" 
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">None (Shared / Corporate)</option>
                {departments.data?.filter((d) => d.status === "active").map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Location</label>
              <input 
                name="location" 
                placeholder="e.g. Mumbai Office, Floor 3"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" 
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input 
                  name="is_bookable" 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                />
                Mark as shared bookable resource
              </label>
            </div>
          </div>

          <button 
            disabled={registerAssetMutation.isPending} 
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors"
          >
            {registerAssetMutation.isPending ? "Registering..." : "Register Asset"}
          </button>
        </form>
      </div>

      {/* Allocate Asset Modal */}
      {allocateAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Allocate Asset</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign "{allocateAsset.name}" to an owner.</p>
              </div>
              <button 
                onClick={() => setAllocateAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAllocateSubmit} className="p-6 space-y-4">
              <div className="flex gap-4 p-1.5 bg-slate-100 rounded-xl w-fit">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer px-3 py-1.5 rounded-lg bg-white shadow-sm">
                  <input type="radio" name="type" value="user" defaultChecked />
                  Employee
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer px-3 py-1.5 rounded-lg">
                  <input type="radio" name="type" value="department" />
                  Department
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Employee</label>
                <select 
                  name="user_id" 
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.data?.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Department</label>
                <select 
                  name="department_id" 
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Department --</option>
                  {departments.data?.filter(d => d.status === "active").map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected Return Date</label>
                <input 
                  type="date" 
                  name="expected_return_date"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setAllocateAsset(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={allocateAssetMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors"
                >
                  {allocateAssetMutation.isPending ? "Allocating..." : "Confirm Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      {returnAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Return Asset</h3>
                <p className="text-xs text-slate-500 mt-0.5">Process return for "{returnAsset.asset.name}"</p>
              </div>
              <button 
                onClick={() => setReturnAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Asset Condition on Return *</label>
                <select 
                  name="condition_on_return" 
                  defaultValue={returnAsset.asset.condition}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {assetConditions.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Return Notes / Comments</label>
                <textarea 
                  name="return_notes"
                  placeholder="Describe the condition of the asset or any issues..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setReturnAsset(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={returnAssetMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm disabled:opacity-60 transition-colors"
                >
                  {returnAssetMutation.isPending ? "Returning..." : "Complete Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Request Modal */}
      {transferAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Request Transfer</h3>
                <p className="text-xs text-slate-500 mt-0.5">Request transfer for "{transferAllocation.asset.name}"</p>
              </div>
              <button 
                onClick={() => setTransferAllocation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                This asset is currently allocated to{" "}
                <strong className="font-semibold text-slate-950">
                  {transferAllocation.user?.name || transferAllocation.department?.name || "Unknown holder"}
                </strong>.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Transfer *</label>
                <textarea 
                  name="reason"
                  required
                  placeholder="Why is this transfer being requested?"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setTransferAllocation(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createTransferMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 shadow-sm disabled:opacity-60 transition-colors"
                >
                  {createTransferMutation.isPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
