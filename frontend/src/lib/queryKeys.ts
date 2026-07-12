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
}
