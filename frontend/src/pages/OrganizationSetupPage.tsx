import { useState, type FormEvent } from "react"

import { useCategories, useDepartments, useEmployees } from "@/hooks/queries"
import { useUpsertCategory, useUpsertDepartment } from "@/hooks/mutations"
import type { AssetCategory, Department } from "@/lib/database.types"

type Tab = "departments" | "categories"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

export function OrganizationSetupPage() {
  const [activeTab, setActiveTab] = useState<Tab>("departments")
  const [feedback, setFeedback] = useState<string | null>(null)
  const departments = useDepartments()
  const categories = useCategories()
  const employees = useEmployees()
  const upsertDepartment = useUpsertDepartment()
  const upsertCategory = useUpsertCategory()

  async function handleDepartmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    const form = new FormData(event.currentTarget)
    const payload: Partial<Department> = {
      name: String(form.get("name") ?? "").trim(),
      parent_department_id: String(form.get("parent_department_id") || "") || null,
      department_head_id: String(form.get("department_head_id") || "") || null,
      status: "active",
    }

    try {
      await upsertDepartment.mutateAsync(payload)
      event.currentTarget.reset()
      setFeedback("Department saved.")
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    const form = new FormData(event.currentTarget)
    const payload: Partial<AssetCategory> = {
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") || "") || null,
      custom_fields_schema: {},
      status: "active",
    }

    try {
      await upsertCategory.mutateAsync(payload)
      event.currentTarget.reset()
      setFeedback("Category saved.")
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  const isLoading = departments.isLoading || categories.isLoading || employees.isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Organization setup</h1>
          <p className="text-sm text-slate-500">Maintain the master data used by assets and workflows.</p>
        </div>
        <div className="inline-flex w-fit rounded-md border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveTab("departments")}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              activeTab === "departments" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Departments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              activeTab === "categories" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Categories
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{feedback}</div>
      )}

      {activeTab === "departments" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-950">Departments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td className="px-5 py-4 text-slate-500" colSpan={3}>Loading...</td></tr>
                  ) : departments.data?.length ? (
                    departments.data.map((department) => (
                      <tr key={department.id}>
                        <td className="px-5 py-4 font-medium text-slate-900">{department.name}</td>
                        <td className="px-5 py-4 capitalize text-slate-600">{department.status}</td>
                        <td className="px-5 py-4 text-slate-500">{new Date(department.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="px-5 py-4 text-slate-500" colSpan={3}>No departments yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <form onSubmit={handleDepartmentSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">Add department</h2>
            <label className="block text-sm font-medium text-slate-700">
              Name
              <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Parent department
              <select name="parent_department_id" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="">None</option>
                {departments.data?.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Department head
              <select name="department_head_id" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="">Unassigned</option>
                {employees.data?.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </label>
            <button disabled={upsertDepartment.isPending} className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60">
              {upsertDepartment.isPending ? "Saving..." : "Save department"}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-950">Asset categories</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td className="px-5 py-4 text-slate-500" colSpan={3}>Loading...</td></tr>
                  ) : categories.data?.length ? (
                    categories.data.map((category) => (
                      <tr key={category.id}>
                        <td className="px-5 py-4 font-medium text-slate-900">{category.name}</td>
                        <td className="px-5 py-4 text-slate-600">{category.description ?? "-"}</td>
                        <td className="px-5 py-4 capitalize text-slate-600">{category.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="px-5 py-4 text-slate-500" colSpan={3}>No categories yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <form onSubmit={handleCategorySubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">Add category</h2>
            <label className="block text-sm font-medium text-slate-700">
              Name
              <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea name="description" rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <button disabled={upsertCategory.isPending} className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60">
              {upsertCategory.isPending ? "Saving..." : "Save category"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
