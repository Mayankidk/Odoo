import { useState, type FormEvent } from "react"
import { useCategories, useDepartments, useEmployees } from "@/hooks/queries"
import { useUpsertCategory, useUpsertDepartment, useUpdateUserRole } from "@/hooks/mutations"
import type { AssetCategory, Department, User, UserRole } from "@/lib/database.types"
import { useAuthStore } from "@/stores/authStore"
import { toast } from "sonner"
import { Building2, FolderKanban, Users, Plus, Pencil, X, ShieldAlert } from "lucide-react"

type Tab = "departments" | "categories" | "employees"

const rolesList: UserRole[] = ["admin", "asset_manager", "department_head", "employee"]

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

export function OrganizationSetupPage() {
  const [activeTab, setActiveTab] = useState<Tab>("departments")

  // Department state
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  // Category state
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null)

  // Employee state
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const profile = useAuthStore((state) => state.profile)
  const isAdmin = profile?.role === "admin"

  // Queries
  const departments = useDepartments()
  const categories = useCategories()
  const employees = useEmployees()

  // Mutations
  const upsertDepartment = useUpsertDepartment()
  const upsertCategory = useUpsertCategory()
  const updateUserRoleMutation = useUpdateUserRole()

  async function handleDepartmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload: Partial<Department> = {
      name: String(form.get("name") ?? "").trim(),
      parent_department_id: String(form.get("parent_department_id") || "") || null,
      department_head_id: String(form.get("department_head_id") || "") || null,
      status: (String(form.get("status") || "active")) as "active" | "inactive",
    }
    if (editingDepartment) payload.id = editingDepartment.id
    try {
      await upsertDepartment.mutateAsync(payload)
      event.currentTarget.reset()
      setEditingDepartment(null)
      toast.success(editingDepartment ? "Department updated!" : "Department created!")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload: Partial<AssetCategory> = {
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") || "") || null,
      status: (String(form.get("status") || "active")) as "active" | "inactive",
      custom_fields_schema: editingCategory?.custom_fields_schema ?? {},
    }
    if (editingCategory) payload.id = editingCategory.id
    try {
      await upsertCategory.mutateAsync(payload)
      event.currentTarget.reset()
      setEditingCategory(null)
      toast.success(editingCategory ? "Category updated!" : "Category created!")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleEditUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingUser) return
    const formData = new FormData(event.currentTarget)
    const role = formData.get("role") as UserRole
    const departmentId = formData.get("department_id") ? String(formData.get("department_id")) : null
    const status = formData.get("status") as "active" | "inactive"
    try {
      await updateUserRoleMutation.mutateAsync({ userId: editingUser.id, role, departmentId, status })
      toast.success("User profile and role updated!")
      setEditingUser(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isLoading = departments.isLoading || categories.isLoading || employees.isLoading

  const filteredEmployees = (employees.data ?? []).filter((emp: any) => {
    const q = search.toLowerCase()
    return emp.name?.toLowerCase().includes(q) || emp.email?.toLowerCase().includes(q)
  })

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin": return "bg-rose-50 text-rose-700 ring-rose-600/20"
      case "asset_manager": return "bg-blue-50 text-blue-700 ring-blue-600/20"
      case "department_head": return "bg-purple-50 text-purple-700 ring-purple-600/20"
      default: return "bg-slate-50 text-slate-700 ring-slate-600/20"
    }
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "categories", label: "Asset Categories", icon: FolderKanban },
    { id: "employees", label: "Employee Directory", icon: Users },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organization Setup</h1>
          <p className="text-sm text-slate-500 mt-2">Maintain master data for departments, asset categories, and the employee directory.</p>
        </div>
        <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setEditingDepartment(null)
                setEditingCategory(null)
                setEditingUser(null)
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB A: DEPARTMENTS ─── */}
      {activeTab === "departments" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Departments Directory
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Parent Dept</th>
                    <th className="px-6 py-4">Department Head</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={5}>Loading departments...</td></tr>
                  ) : departments.data?.length ? (
                    departments.data.map((dept) => {
                      const parent = departments.data?.find(d => d.id === dept.parent_department_id)
                      const head = (employees.data ?? []).find((e: any) => e.id === dept.department_head_id)
                      return (
                        <tr key={dept.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{dept.name}</td>
                          <td className="px-6 py-4 text-slate-600">{parent ? parent.name : "—"}</td>
                          <td className="px-6 py-4 text-slate-600">{head ? head.name : "—"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              dept.status === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-50 text-slate-600 ring-slate-500/10"
                            }`}>
                              {dept.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setEditingDepartment(dept)}
                              className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit Department"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={5}>No departments found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <form
            onSubmit={handleDepartmentSubmit}
            key={editingDepartment?.id || "new-dept"}
            className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm h-fit"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                {editingDepartment ? "Edit Department" : "Add Department"}
              </h2>
              {editingDepartment && (
                <button type="button" onClick={() => setEditingDepartment(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                <input name="name" required defaultValue={editingDepartment?.name || ""} placeholder="e.g. Engineering, HR"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Department</label>
                <select name="parent_department_id" defaultValue={editingDepartment?.parent_department_id || ""}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="">None (Top Level)</option>
                  {departments.data?.filter(d => d.id !== editingDepartment?.id).map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Head</label>
                <select name="department_head_id" defaultValue={editingDepartment?.department_head_id || ""}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="">Unassigned</option>
                  {(employees.data ?? []).map((employee: any) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </div>
              {editingDepartment && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select name="status" defaultValue={editingDepartment.status}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            <button disabled={upsertDepartment.isPending}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors">
              {upsertDepartment.isPending ? "Saving..." : editingDepartment ? "Update Department" : "Create Department"}
            </button>
          </form>
        </div>
      )}

      {/* ─── TAB B: ASSET CATEGORIES ─── */}
      {activeTab === "categories" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-blue-500" />
                Asset Categories Directory
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={4}>Loading categories...</td></tr>
                  ) : categories.data?.length ? (
                    categories.data.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{cat.name}</td>
                        <td className="px-6 py-4 text-slate-600">{cat.description ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            cat.status === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-50 text-slate-600 ring-slate-500/10"
                          }`}>
                            {cat.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setEditingCategory(cat)}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Edit Category">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={4}>No categories found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <form
            onSubmit={handleCategorySubmit}
            key={editingCategory?.id || "new-cat"}
            className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm h-fit"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              {editingCategory && (
                <button type="button" onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                <input name="name" required defaultValue={editingCategory?.name || ""} placeholder="e.g. Laptops, Vehicles"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea name="description" rows={4} defaultValue={editingCategory?.description || ""}
                  placeholder="Describe this category of assets..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none h-24" />
              </div>
              {editingCategory && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select name="status" defaultValue={editingCategory.status}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            <button disabled={upsertCategory.isPending}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors">
              {upsertCategory.isPending ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </button>
          </form>
        </div>
      )}

      {/* ─── TAB C: EMPLOYEE DIRECTORY ─── */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          {!isAdmin && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
              Only Admins can promote or reassign employee roles. You are viewing in read-only mode.
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Employee Directory
              <span className="text-sm font-normal text-slate-400">({filteredEmployees.length} people)</span>
            </h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-xs w-full"
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={6}>Loading employees...</td></tr>
                  ) : filteredEmployees.length ? (
                    filteredEmployees.map((emp: any) => {
                      const dept = departments.data?.find(d => d.id === emp.department_id)
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {emp.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </div>
                              <span className="font-semibold text-slate-900">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{emp.email}</td>
                          <td className="px-6 py-4 text-slate-600">{dept?.name ?? "—"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRoleBadgeColor(emp.role)}`}>
                              {emp.role?.replace("_", " ")}
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
                                className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Edit Role"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  ) : (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={6}>No employees found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Edit User Role Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Edit Employee Role</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{editingUser.name} · {editingUser.email}</p>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
                    <select name="role" required defaultValue={editingUser.role}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                      {rolesList.map(r => (
                        <option key={r} value={r}>{r.replace("_", " ")}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Roles can only be assigned here by an Admin.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                    <select name="department_id" defaultValue={editingUser.department_id ?? ""}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                      <option value="">— No Department —</option>
                      {departments.data?.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                    <select name="status" defaultValue={editingUser.status ?? "active"}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setEditingUser(null)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={updateUserRoleMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm disabled:opacity-60 transition-colors">
                      {updateUserRoleMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
