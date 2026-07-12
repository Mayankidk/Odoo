import { useState, type FormEvent } from "react"
import { useCategories, useDepartments, useEmployees } from "@/hooks/queries"
import { useUpsertCategory, useUpsertDepartment } from "@/hooks/mutations"
import type { AssetCategory, Department } from "@/lib/database.types"
import { toast } from "sonner"
import { Building2, FolderKanban, Plus, Pencil, X } from "lucide-react"

type Tab = "departments" | "categories"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

export function OrganizationSetupPage() {
  const [activeTab, setActiveTab] = useState<Tab>("departments")
  
  // Edit states
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null)

  // Queries
  const departments = useDepartments()
  const categories = useCategories()
  const employees = useEmployees()

  // Mutations
  const upsertDepartment = useUpsertDepartment()
  const upsertCategory = useUpsertCategory()

  async function handleDepartmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const payload: Partial<Department> = {
      name: String(form.get("name") ?? "").trim(),
      parent_department_id: String(form.get("parent_department_id") || "") || null,
      department_head_id: String(form.get("department_head_id") || "") || null,
      status: (String(form.get("status") || "active")) as "active" | "inactive",
    }

    if (editingDepartment) {
      payload.id = editingDepartment.id
    }

    try {
      await upsertDepartment.mutateAsync(payload)
      event.currentTarget.reset()
      setEditingDepartment(null)
      toast.success(editingDepartment ? "Department updated successfully!" : "Department added successfully!")
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

    if (editingCategory) {
      payload.id = editingCategory.id
    }

    try {
      await upsertCategory.mutateAsync(payload)
      event.currentTarget.reset()
      setEditingCategory(null)
      toast.success(editingCategory ? "Category updated successfully!" : "Category added successfully!")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isLoading = departments.isLoading || categories.isLoading || employees.isLoading

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organization Setup</h1>
          <p className="text-sm text-slate-500 mt-2">Maintain the master data used by assets and workflows.</p>
        </div>
        <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => { setActiveTab("departments"); setEditingDepartment(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "departments" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Departments
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("categories"); setEditingCategory(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "categories" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Categories
          </button>
        </div>
      </div>

      {activeTab === "departments" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Departments Table */}
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
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={4}>Loading departments...</td></tr>
                  ) : departments.data?.length ? (
                    departments.data.map((dept) => {
                      const parent = departments.data.find(d => d.id === dept.parent_department_id)
                      return (
                        <tr key={dept.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{dept.name}</td>
                          <td className="px-6 py-4 text-slate-600">{parent ? parent.name : "-"}</td>
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
                    <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={4}>No departments found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Department Form */}
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
                <button
                  type="button"
                  onClick={() => setEditingDepartment(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                <input 
                  name="name" 
                  required 
                  defaultValue={editingDepartment?.name || ""}
                  placeholder="e.g. Engineering, HR"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Department</label>
                <select 
                  name="parent_department_id" 
                  defaultValue={editingDepartment?.parent_department_id || ""}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">None (Top Level)</option>
                  {departments.data?.filter(d => d.id !== editingDepartment?.id).map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Head</label>
                <select 
                  name="department_head_id" 
                  defaultValue={editingDepartment?.department_head_id || ""}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {employees.data?.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </div>

              {editingDepartment && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingDepartment.status}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <button 
              disabled={upsertDepartment.isPending} 
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors"
            >
              {upsertDepartment.isPending ? "Saving..." : editingDepartment ? "Update Department" : "Create Department"}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Categories Table */}
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
                        <td className="px-6 py-4 text-slate-600">{cat.description ?? "-"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            cat.status === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-50 text-slate-600 ring-slate-500/10"
                          }`}>
                            {cat.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditingCategory(cat)}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit Category"
                          >
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

          {/* Category Form */}
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
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                <input 
                  name="name" 
                  required 
                  defaultValue={editingCategory?.name || ""}
                  placeholder="e.g. Laptops, Vehicles"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows={4}
                  defaultValue={editingCategory?.description || ""}
                  placeholder="Describe this category of assets..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none h-24" 
                />
              </div>

              {editingCategory && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingCategory.status}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <button 
              disabled={upsertCategory.isPending} 
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors"
            >
              {upsertCategory.isPending ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
