import { useState } from "react"
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/queries/useNotifications"
import { useAuditLogs } from "@/hooks/queries/useAuditLogs"
import { useAuthStore } from "@/stores/authStore"
import { Bell, Check, Search, Filter, Eye, X, Calendar, User as UserIcon } from "lucide-react"
import { toast } from "sonner"

export function NotificationsPage() {
  const profile = useAuthStore((state) => state.profile)
  const isManager = profile?.role === "admin" || profile?.role === "asset_manager"

  const [activeTab, setActiveTab] = useState<"notifications" | "audit_logs">("notifications")

  // Notifications State
  const { data: notifications = [], isLoading: isLoadingNotifications } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead } = useMarkAllNotificationsRead()

  // Audit Logs State
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [resourceFilter, setResourceFilter] = useState("")
  const [auditPage, setAuditPage] = useState(1)
  const auditPageSize = 12
  const [inspectingLog, setInspectingLog] = useState<any | null>(null)

  const { data: auditData, isLoading: isLoadingAudits } = useAuditLogs({
    search,
    action: actionFilter || undefined,
    resourceType: resourceFilter || undefined,
    page: auditPage,
    pageSize: auditPageSize,
  })

  const auditLogs = auditData?.data ?? []
  const totalAuditCount = auditData?.count ?? 0
  const totalAuditPages = Math.ceil(totalAuditCount / auditPageSize)

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

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "asset_assigned":
        return "bg-blue-50 text-blue-700 border border-blue-200"
      case "asset_returned":
        return "bg-green-50 text-green-700 border border-green-200"
      case "maintenance_approved":
      case "booking_confirmed":
      case "transfer_approved":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200"
      case "maintenance_rejected":
      case "booking_cancelled":
      case "transfer_rejected":
        return "bg-red-50 text-red-700 border border-red-200"
      case "overdue_return":
        return "bg-amber-50 text-amber-700 border border-amber-200"
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200"
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications & Activity Logs</h1>
        <p className="text-sm text-slate-500 mt-2">
          View your alerts and review the system's chronological audit trail.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === "notifications"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            My Notifications
          </button>
          {isManager && (
            <button
              onClick={() => setActiveTab("audit_logs")}
              className={`pb-4 text-sm font-medium border-b-2 transition-all ${
                activeTab === "audit_logs"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              System Audit Logs
            </button>
          )}
        </nav>
      </div>

      {/* Notifications Tab Content */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Inbox ({notifications.filter((n: any) => !n.is_read).length} unread)
            </h2>
            {notifications.some((n: any) => !n.is_read) && (
              <button
                onClick={() => {
                  markAllRead()
                  toast.success("All notifications marked as read")
                }}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Check className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
            {isLoadingNotifications ? (
              <div className="p-8 text-center text-slate-400">Loading inbox...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                Your notification inbox is empty.
              </div>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`p-5 flex gap-4 transition-colors hover:bg-slate-50/50 relative ${
                    !n.is_read ? "bg-blue-50/10" : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${getNotificationIconColor(
                      n.type
                    )}`}
                  >
                    {n.title.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-medium ${!n.is_read ? "text-slate-900 font-semibold" : "text-slate-700"}`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      className="absolute right-5 top-5 text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Tab Content */}
      {activeTab === "audit_logs" && isManager && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by action, resource ID, or type..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setAuditPage(1)
                }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value)
                    setAuditPage(1)
                  }}
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
                  onChange={(e) => {
                    setResourceFilter(e.target.value)
                    setAuditPage(1)
                  }}
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
                  {isLoadingAudits ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Loading logs...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No matching audit logs found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log: any) => (
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

            {totalAuditPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs text-slate-500">
                  Showing Page <span className="font-semibold">{auditPage}</span> of{" "}
                  <span className="font-semibold">{totalAuditPages}</span> ({totalAuditCount} total logs)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage(p => p - 1)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={auditPage >= totalAuditPages}
                    onClick={() => setAuditPage(p => p + 1)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
