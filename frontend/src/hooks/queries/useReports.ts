import { useQuery } from "@tanstack/react-query"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useReportsSummary() {
  return useQuery({
    queryKey: queryKeys.reportsSummary,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_reports_summary")
      throwIfError(error)
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUtilizationTrends(months = 6) {
  return useQuery({
    queryKey: queryKeys.utilizationTrends(months),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_asset_utilization_trends", {
        p_months: months,
      })
      throwIfError(error)
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useMaintenanceStats() {
  return useQuery({
    queryKey: queryKeys.maintenanceStats,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_maintenance_stats")
      throwIfError(error)
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useAssetsForAttention() {
  return useQuery({
    queryKey: queryKeys.assetsForAttention,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_assets_due_for_attention")
      throwIfError(error)
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useDepartmentAllocation() {
  return useQuery({
    queryKey: queryKeys.departmentAllocation,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_department_allocation_summary")
      throwIfError(error)
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useBookingHeatmap(days = 90) {
  return useQuery({
    queryKey: queryKeys.bookingHeatmap(days),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_booking_heatmap", {
        p_days: days,
      })
      throwIfError(error)
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
