import { useState } from "react"
import { useAuditLogs } from "@/hooks/queries/useAuditLogs"
import { ShieldCheck, Search, Filter, Eye, X, Calendar, User as UserIcon } from "lucide-react"

export function AuditLogsPage() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [resourceFilter, setResourceFilter] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 15

  const [inspectingLog, setInspectingLog] = useState<any | null>(null)

  // Fetch logs
  const { data, isLoading, error } = useAuditLogs({
    search,
    action: actionFilter || undefined,
    resourceType: resourceFilter || undefined,
    page,
    pageSize,
  })

  const logs = data?.data ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // Reset to page 1 on new search
  }

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(e.target.value)
    setPage(1)
  }

  const handleResourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResourceFilter(e.target.value)
    setPage(1)
  }

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "ALLOCATE":
      case "ASSIGN":
        return "bg-blue-50 text-blue-700 ring-blue-600/20"
      case "RETURN":
        return "bg-green-50 text-green-700 ring-green-600/20"
      case "BOOK":
        return "bg-purple-50 text-purple-700 ring-purple-600/20"
      case "MAINTENANCE":
      case "REPAIR":
        return "bg-amber-50 text-amber-700 ring-amber-600/20"
      case "AUDIT":
        return "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
      case "CREATE":
      case "REGISTER":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      case "UPDATE":
        return "bg-sky-50 text-sky-700 ring-sky-600/20"
      case "DELETE":
        return "bg-rose-50 text-rose-700 ring-rose-600/20"
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20"
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            System Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Track user activities and system-wide modifications chronologically.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          Error loading logs: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, resource ID, or type..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <select
              value={actionFilter}
              onChange={handleActionChange}
              className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">All Actions</option>
              <option value="ALLOCATE">Allocate</option>
              <option value="RETURN">Return</option>
              <option value="BOOK">Book</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
            <Filter className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={resourceFilter}
              onChange={handleResourceChange}
              className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">All Resources</option>
              <option value="asset">Asset</option>
              <option value="booking">Booking</option>
              <option value="allocation">Allocation</option>
              <option value="maintenance">Maintenance</option>
              <option value="transfer">Transfer</option>
              <option value="user">User</option>
            </select>
            <Filter className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource Type</th>
                <th className="px-6 py-4">Resource ID</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-xs">
                          <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{log.user?.name ?? "System"}</span>
                          <span className="text-xs text-slate-400">{log.user?.email ?? ""}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-xs">
                      {log.resource_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400 max-w-[120px] truncate" title={log.resource_id}>
                      {log.resource_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {log.ip_address ?? "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setInspectingLog(log)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs text-slate-500">
              Showing Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span> ({totalCount} total logs)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Log Details Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-semibold text-lg text-slate-900">
                  Inspect Log Event
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  ID: {inspectingLog.id}
                </p>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Header Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">User</span>
                  <span className="font-medium text-slate-800">{inspectingLog.user?.name ?? "System"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Action</span>
                  <span className="font-semibold text-blue-700">{inspectingLog.action}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Resource Type</span>
                  <span className="font-medium text-slate-800 capitalize">{inspectingLog.resource_type}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Created At</span>
                  <span className="font-medium text-slate-800">{new Date(inspectingLog.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Payload Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Old Values
                  </h4>
                  <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-auto max-h-72 border border-slate-800">
                    {inspectingLog.old_values 
                      ? JSON.stringify(inspectingLog.old_values, null, 2) 
                      : "NULL (No prior values)"}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    New Values
                  </h4>
                  <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-auto max-h-72 border border-slate-800">
                    {inspectingLog.new_values 
                      ? JSON.stringify(inspectingLog.new_values, null, 2) 
                      : "NULL (No updated values)"}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
