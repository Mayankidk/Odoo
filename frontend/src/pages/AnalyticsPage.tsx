import { useAssets, useAllocations, useMaintenanceRequests, useBookings, useCategories, useDepartments } from "@/hooks/queries"
import { BarChart3, Download, TrendingUp, AlertTriangle, Award, Wrench, Calendar } from "lucide-react"
import { toast } from "sonner"

export function AnalyticsPage() {
  // Queries
  const { data: assetsData, isLoading: isLoadingAssets } = useAssets({ pageSize: 1000 })
  const { isLoading: isLoadingAllocations } = useAllocations()
  const { data: maintenanceRequests = [], isLoading: isLoadingMaintenance } = useMaintenanceRequests()
  const { data: bookings = [], isLoading: isLoadingBookings } = useBookings()
  const { data: categories = [] } = useCategories()
  const { data: departments = [] } = useDepartments()

  const assets = assetsData?.data ?? []
  const isLoading = isLoadingAssets || isLoadingAllocations || isLoadingMaintenance || isLoadingBookings

  // --- 1. Compute High-Level Metrics ---
  const totalAssetsCount = assets.length
  const allocatedAssetsCount = assets.filter(a => a.status === "allocated").length
  const utilizationRate = totalAssetsCount > 0 ? Math.round((allocatedAssetsCount / totalAssetsCount) * 100) : 0
  
  const totalAssetCost = assets.reduce((sum, a) => sum + (a.acquisition_cost ?? 0), 0)
  const formattedTotalCost = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(totalAssetCost)

  const activeMaintenanceCount = assets.filter(a => a.status === "under_maintenance").length

  // --- 2. Compute Department Allocation Share ---
  // Group active allocations by department
  const deptAllocCounts: Record<string, number> = {}
  assets.forEach((asset) => {
    if (asset.status === "allocated" && asset.department_id) {
      const deptName = departments.find(d => d.id === asset.department_id)?.name ?? "Unknown Dept"
      deptAllocCounts[deptName] = (deptAllocCounts[deptName] || 0) + 1
    }
  })
  const deptAllocData = Object.entries(deptAllocCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const maxDeptAlloc = deptAllocData.length > 0 ? Math.max(...deptAllocData.map(d => d.count)) : 1

  // --- 3. Compute Maintenance per Category ---
  // Group maintenance requests by category
  const categoryMaintenanceCounts: Record<string, number> = {}
  maintenanceRequests.forEach((req: any) => {
    // Find the category of the request's asset
    const asset = assets.find(a => a.id === req.asset_id)
    if (asset && asset.category_id) {
      const catName = categories.find(c => c.id === asset.category_id)?.name ?? "General"
      categoryMaintenanceCounts[catName] = (categoryMaintenanceCounts[catName] || 0) + 1
    }
  })
  const catMaintenanceData = Object.entries(categoryMaintenanceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const maxCatMaintenance = catMaintenanceData.length > 0 ? Math.max(...catMaintenanceData.map(c => c.count)) : 1

  // --- 4. Identify Assets Nearing Retirement / Needing Maintenance ---
  // A asset is due for retirement if condition is "poor" or if it is older than 5 years (1825 days)
  const nearingRetirementAssets = assets.filter((asset) => {
    const isPoor = asset.condition === "poor"
    let isOld = false
    if (asset.acquisition_date) {
      const acquisitionTime = new Date(asset.acquisition_date).getTime()
      const fiveYearsAgo = Date.now() - 5 * 365 * 24 * 60 * 60 * 1000
      isOld = acquisitionTime < fiveYearsAgo
    }
    return (isPoor || isOld) && asset.status !== "retired" && asset.status !== "disposed"
  })

  // --- 5. Hourly Bookings Heatmap ---
  // Group bookings by hour slot (9 AM to 6 PM)
  const hourSlots = Array.from({ length: 10 }, (_, i) => 9 + i) // [9, 10, ..., 18]
  const bookingHourCounts: Record<number, number> = {}
  bookings.forEach((booking: any) => {
    if (booking.start_time) {
      const hour = new Date(booking.start_time).getHours()
      if (hour >= 9 && hour <= 18) {
        bookingHourCounts[hour] = (bookingHourCounts[hour] || 0) + 1
      }
    }
  })
  const maxBookingCount = Object.keys(bookingHourCounts).length > 0 ? Math.max(...Object.values(bookingHourCounts)) : 1

  // --- 6. Export to CSV Helper ---
  const handleExportCSV = () => {
    if (assets.length === 0) {
      toast.error("No asset data to export.")
      return
    }

    const headers = ["Asset Tag", "Asset Name", "Category", "Department", "Location", "Condition", "Status", "Acquisition Cost", "Acquisition Date"]
    const rows = assets.map((asset: any) => {
      const categoryName = categories.find(c => c.id === asset.category_id)?.name ?? "N/A"
      const departmentName = departments.find(d => d.id === asset.department_id)?.name ?? "Shared"
      return [
        asset.asset_tag,
        `"${asset.name.replace(/"/g, '""')}"`,
        categoryName,
        departmentName,
        asset.location ? `"${asset.location.replace(/"/g, '""')}"` : "",
        asset.condition,
        asset.status,
        asset.acquisition_cost ?? "",
        asset.acquisition_date ?? ""
      ]
    })

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `assetflow_inventory_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Assets inventory report exported to CSV!")
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics &amp; Reports</h1>
          <p className="text-sm text-slate-500 mt-2">Get operational snapshots, resource heatmaps, and retirement logs.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export Inventory CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
          <p className="text-slate-500 text-sm">Computing analytics metrics...</p>
        </div>
      ) : (
        <>
          {/* Metrics Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset Utilization</span>
                <div className="text-3xl font-bold text-slate-900">{utilizationRate}%</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inventory Value</span>
                <div className="text-2xl font-bold text-slate-900 truncate max-w-[160px]">{formattedTotalCost}</div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under Maintenance</span>
                <div className="text-3xl font-bold text-slate-900">{activeMaintenanceCount}</div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Wrench className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nearing Retirement</span>
                <div className="text-3xl font-bold text-rose-600">{nearingRetirementAssets.length}</div>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Allocation Share (Horizontal Bar Chart) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Department Allocation Share
              </h3>
              {deptAllocData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm min-h-[220px]">
                  No active allocations to show.
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {deptAllocData.map((dept) => {
                    const widthPercent = Math.round((dept.count / maxDeptAlloc) * 100)
                    return (
                      <div key={dept.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span>{dept.name}</span>
                          <span className="text-slate-900 font-semibold">{dept.count} asset{dept.count > 1 ? "s" : ""}</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${widthPercent}%` }}
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Maintenance Frequency per Category (Horizontal Bar Chart) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Maintenance Requests by Category
              </h3>
              {catMaintenanceData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm min-h-[220px]">
                  No maintenance records found.
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {catMaintenanceData.map((cat) => {
                    const widthPercent = Math.round((cat.count / maxCatMaintenance) * 100)
                    return (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span>{cat.name}</span>
                          <span className="text-slate-900 font-semibold">{cat.count} request{cat.count > 1 ? "s" : ""}</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${widthPercent}%` }}
                            className="h-full bg-purple-600 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Heatmap Calendar Day Grid */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Resource Booking Peak Hours
              </h3>
              <p className="text-xs text-slate-500 mb-6">Visualizing booking frequency by hour slots (9 AM - 6 PM).</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 flex-1">
                {hourSlots.map((hour) => {
                  const count = bookingHourCounts[hour] ?? 0
                  const timeLabel = hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`
                  
                  // Heatmap colors based on booking counts
                  let bgClass = "bg-slate-50 border-slate-200 text-slate-700"
                  if (count > 0) {
                    const ratio = count / maxBookingCount
                    if (ratio > 0.7) {
                      bgClass = "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    } else if (ratio > 0.4) {
                      bgClass = "bg-indigo-100 border-indigo-200 text-indigo-800"
                    } else {
                      bgClass = "bg-indigo-50/50 border-indigo-100 text-indigo-600"
                    }
                  }

                  return (
                    <div 
                      key={hour}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${bgClass}`}
                    >
                      <span className="text-xs font-semibold uppercase">{timeLabel}</span>
                      <span className="text-lg font-bold mt-1">{count}</span>
                      <span className="text-[10px] opacity-75 mt-0.5">booking{count === 1 ? "" : "s"}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Assets Nearing Retirement Warning Log */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Retirement &amp; Refurbish Alert
              </h3>
              <p className="text-xs text-slate-500 mb-6">Assets in poor condition or active for over 5 years.</p>
              
              {nearingRetirementAssets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm bg-slate-50/50 border border-dashed rounded-xl border-slate-200 p-4">
                  No assets needing replacement.
                </div>
              ) : (
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] pr-1">
                  {nearingRetirementAssets.map((asset) => (
                    <div key={asset.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 text-xs flex justify-between items-start gap-2">
                      <div>
                        <div className="font-semibold text-slate-950">{asset.name}</div>
                        <div className="text-slate-400 font-mono text-[10px] mt-0.5">{asset.asset_tag}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        asset.condition === "poor" ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}>
                        {asset.condition === "poor" ? "Poor Condition" : "5+ Yrs Old"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
