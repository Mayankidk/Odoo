export const queryKeys = {
  dashboardKpis: ["dashboard", "kpis"] as const,
  departments: ["departments"] as const,
  categories: ["asset-categories"] as const,
  employees: ["employees"] as const,
  assets: (filters?: unknown) => ["assets", filters ?? {}] as const,
  allocations: ["allocations"] as const,
  bookings: ["bookings"] as const,
  maintenanceRequests: ["maintenance-requests"] as const,
  auditCycles: ["audit-cycles"] as const,
  auditItems: (auditCycleId?: string) => ["audit-items", auditCycleId ?? "all"] as const,
  // Analytics / Reports
  reportsSummary: ["reports", "summary"] as const,
  utilizationTrends: (months: number) => ["reports", "utilization-trends", months] as const,
  maintenanceStats: ["reports", "maintenance-stats"] as const,
  assetsForAttention: ["reports", "assets-attention"] as const,
  departmentAllocation: ["reports", "department-allocation"] as const,
  bookingHeatmap: (days: number) => ["reports", "booking-heatmap", days] as const,
}
