import { useState, type FormEvent } from "react"

import { useRegisterAsset } from "@/hooks/mutations"
import { useAssets, useCategories, useDepartments } from "@/hooks/queries"
import type { Asset, AssetCondition } from "@/lib/database.types"
import { useAuthStore } from "@/stores/authStore"

const assetConditions: AssetCondition[] = ["new", "good", "fair", "poor", "damaged"]

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

function getRelatedName(value: unknown) {
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name)
  }

  return "-"
}

export function AssetsPage() {
  const [search, setSearch] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const user = useAuthStore((state) => state.user)
  const assets = useAssets({ search, pageSize: 50 })
  const categories = useCategories()
  const departments = useDepartments()
  const registerAsset = useRegisterAsset()

  async function handleRegisterAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    if (!user) {
      setFeedback("You need to be signed in to register an asset.")
      return
    }

    const form = new FormData(event.currentTarget)
    const acquisitionCost = String(form.get("acquisition_cost") || "")
    const payload: Partial<Asset> = {
      name: String(form.get("name") ?? "").trim(),
      category_id: String(form.get("category_id") ?? ""),
      serial_number: String(form.get("serial_number") || "") || null,
      acquisition_date: String(form.get("acquisition_date") || "") || null,
      acquisition_cost: acquisitionCost ? Number(acquisitionCost) : null,
      condition: String(form.get("condition") ?? "good") as AssetCondition,
      location: String(form.get("location") || "") || null,
      department_id: String(form.get("department_id") || "") || null,
      is_bookable: form.get("is_bookable") === "on",
      registered_by: user.id,
      custom_fields: {},
      status: "available",
    }

    try {
      await registerAsset.mutateAsync(payload)
      event.currentTarget.reset()
      setFeedback("Asset registered.")
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Assets</h1>
          <p className="text-sm text-slate-500">Register assets and track their current lifecycle state.</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by asset name"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:w-72"
        />
      </div>

      {feedback && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{feedback}</div>
      )}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-950">Asset directory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Asset</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Condition</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Bookable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.isLoading ? (
                  <tr><td className="px-5 py-4 text-slate-500" colSpan={6}>Loading assets...</td></tr>
                ) : assets.data?.data.length ? (
                  assets.data.data.map((asset) => (
                    <tr key={asset.id}>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">{asset.name}</div>
                        <div className="text-xs text-slate-500">{asset.asset_tag}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{getRelatedName("category" in asset ? asset.category : null)}</td>
                      <td className="px-5 py-4 capitalize text-slate-600">{asset.status.replaceAll("_", " ")}</td>
                      <td className="px-5 py-4 capitalize text-slate-600">{asset.condition}</td>
                      <td className="px-5 py-4 text-slate-600">{asset.location ?? "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{asset.is_bookable ? "Yes" : "No"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-5 py-4 text-slate-500" colSpan={6}>No assets found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <form onSubmit={handleRegisterAsset} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Register asset</h2>
          <label className="block text-sm font-medium text-slate-700">
            Asset name
            <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Category
            <select name="category_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">Select category</option>
              {categories.data?.filter((category) => category.status === "active").map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Serial number
              <input name="serial_number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Condition
              <select name="condition" defaultValue="good" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                {assetConditions.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Acquisition date
              <input name="acquisition_date" type="date" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Cost
              <input name="acquisition_cost" type="number" min="0" step="0.01" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Owning department
            <select name="department_id" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">None</option>
              {departments.data?.filter((department) => department.status === "active").map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Location
            <input name="location" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input name="is_bookable" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            Shared bookable resource
          </label>
          <button disabled={registerAsset.isPending} className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60">
            {registerAsset.isPending ? "Saving..." : "Register asset"}
          </button>
        </form>
      </div>
    </div>
  )
}
