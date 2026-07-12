import { useState, type FormEvent } from "react"
import { useEmployees, useDepartments } from "@/hooks/queries"
import { useUpdateUserRole } from "@/hooks/mutations"
import { useAuthStore } from "@/stores/authStore"
import type { User, UserRole } from "@/lib/database.types"
import { toast } from "sonner"
import { Users, Pencil, X, ShieldAlert } from "lucide-react"

const rolesList: UserRole[] = ["admin", "asset_manager", "department_head", "employee"]

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

export function UsersPage() {
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const profile = useAuthStore((state) => state.profile)
  const isAdmin = profile?.role === "admin"

  // Queries
  const { data: employees = [], isLoading: isLoadingEmployees, error: employeesError } = useEmployees()
  const { data: departments = [] } = useDepartments()

  // Mutations
  const updateUserRoleMutation = useUpdateUserRole()

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUser) return

    const formData = new FormData(event.currentTarget)
    const role = formData.get("role") as UserRole
    const departmentId = formData.get("department_id") ? String(formData.get("department_id")) : null
    const status = formData.get("status") as "active" | "inactive"

    try {
      await updateUserRoleMutation.mutateAsync({
        userId: editingUser.id,
        role,
        departmentId,
        status,
      })
      toast.success("User profile and role updated successfully!")
      setEditingUser(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-rose-50 text-rose-700 ring-rose-600/20"
      case "asset_manager":
        return "bg-blue-50 text-blue-700 ring-blue-600/20"
      case "department_head":
        return "bg-purple-50 text-purple-700 ring-purple-600/20"
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20"
    }
  }

  // Filter employees locally
  const filteredEmployees = employees.filter((emp: any) => {
    const nameMatch = emp.name.toLowerCase().includes(search.toLowerCase())
    const emailMatch = emp.email.toLowerCase().includes(search.toLowerCase())
    return nameMatch || emailMatch
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employee Directory</h1>
        <p className="text-sm text-slate-500 mt-2">Manage roles, departments, and user system access.</p>
      </div>

      {employeesError && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          {employeesError.message}
        </div>
      )}

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name or email..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Directory Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Users Directory
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Employee Details</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingEmployees ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={isAdmin ? 5 : 4}>
                      Loading employee directory...
                    </td>
                  </tr>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{emp.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {emp.department?.name || "Shared / Corporate"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRoleBadgeColor(emp.role)}`}>
                          {emp.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          emp.status === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-50 text-slate-600 ring-slate-500/10"
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditingUser(emp)}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit User Profile"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={isAdmin ? 5 : 4}>
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Edit Employee / Promote Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Update Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage permissions for {editingUser.name}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee Name</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={editingUser.name}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={editingUser.email}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                <select
                  name="department_id"
                  defaultValue={editingUser.department_id || ""}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">None (Shared / Corporate)</option>
                  {departments.filter(d => d.status === "active").map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">System Role</label>
                <select
                  name="role"
                  defaultValue={editingUser.role}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none capitalize"
                >
                  {rolesList.map((role) => (
                    <option key={role} value={role}>{role.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Changing roles will affect page access permissions immediately.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Status</label>
                <select
                  name="status"
                  defaultValue={editingUser.status}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none capitalize"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserRoleMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {updateUserRoleMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
