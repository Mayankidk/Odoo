export type UserRole = "admin" | "asset_manager" | "department_head" | "employee"
export type RecordStatus = "active" | "inactive"
export type AssetCondition = "new" | "good" | "fair" | "poor" | "damaged"
export type AssetStatus =
  | "available"
  | "allocated"
  | "reserved"
  | "under_maintenance"
  | "lost"
  | "retired"
  | "disposed"
export type AllocationStatus = "active" | "returned" | "transferred" | "overdue"
export type TransferStatus = "pending" | "approved" | "rejected"
export type BookingStatus = "upcoming" | "ongoing" | "completed" | "cancelled"
export type MaintenancePriority = "low" | "medium" | "high" | "critical"
export type MaintenanceStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "assigned"
  | "in_progress"
  | "resolved"
export type AuditScopeType = "department" | "location"
export type AuditCycleStatus = "planned" | "in_progress" | "completed"
export type AuditVerificationStatus = "pending" | "verified" | "missing" | "damaged"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type RowBase = {
  id: string
  created_at: string
}

type Table<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export type User = RowBase & {
  name: string
  email: string
  role: UserRole
  department_id: string | null
  status: RecordStatus
  updated_at: string
}

export type Department = RowBase & {
  name: string
  parent_department_id: string | null
  department_head_id: string | null
  status: RecordStatus
  updated_at: string
}

export type AssetCategory = RowBase & {
  name: string
  description: string | null
  custom_fields_schema: Json
  status: RecordStatus
  updated_at: string
}

export type Asset = RowBase & {
  asset_tag: string
  name: string
  category_id: string
  serial_number: string | null
  acquisition_date: string | null
  acquisition_cost: number | null
  condition: AssetCondition
  location: string | null
  status: AssetStatus
  is_bookable: boolean
  registered_by: string
  department_id: string | null
  custom_fields: Json
  updated_at: string
}

export type AssetDocument = RowBase & {
  asset_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
}

export type Allocation = RowBase & {
  asset_id: string
  allocated_to_user_id: string | null
  allocated_to_dept_id: string | null
  allocated_by_id: string
  expected_return_date: string | null
  actual_return_date: string | null
  return_notes: string | null
  condition_on_return: AssetCondition | null
  status: AllocationStatus
  updated_at: string
}

export type TransferRequest = RowBase & {
  allocation_id: string
  requested_by_id: string
  approved_by_id: string | null
  status: TransferStatus
  reason: string | null
  rejection_reason: string | null
  updated_at: string
}

export type Booking = RowBase & {
  resource_id: string
  booked_by_id: string
  start_time: string
  end_time: string
  purpose: string | null
  status: BookingStatus
  updated_at: string
}

export type MaintenanceRequest = RowBase & {
  asset_id: string
  raised_by_id: string
  approved_by_id: string | null
  assigned_technician_id: string | null
  description: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  resolution_notes: string | null
  resolved_at: string | null
  updated_at: string
}

export type AuditCycle = RowBase & {
  name: string
  scope_type: AuditScopeType
  scope_id: string | null
  scope_location: string | null
  start_date: string
  end_date: string
  status: AuditCycleStatus
  created_by_id: string
  updated_at: string
}

export type AuditItem = RowBase & {
  audit_cycle_id: string
  asset_id: string
  verified_by_id: string | null
  verification_status: AuditVerificationStatus
  notes: string | null
  verified_at: string | null
}

// ── Analytics / Reports types ──────────────────────────────────────────────

export type UtilizationTrendPoint = {
  month: string
  month_date: string
  available: number
  allocated: number
  maintenance: number
  idle: number
}

export type MaintenanceStats = {
  by_priority: Array<{ priority: string; count: number }>
  by_status: Array<{ status: string; count: number }>
  by_category: Array<{ category: string; count: number }>
  monthly_trend: Array<{
    month: string
    total: number
    resolved: number
    pending: number
  }>
}

export type AttentionSummary = {
  total_overdue_returns: number
  total_poor_condition: number
  total_open_maintenance: number
  total_retired: number
}

export type OverdueReturn = {
  asset_id: string
  asset_name: string
  asset_tag: string
  condition: string
  return_date: string
  days_overdue: number
  department: string | null
}

export type PoorConditionAsset = {
  asset_id: string
  asset_name: string
  asset_tag: string
  condition: string
  status: string
  category: string
  department: string | null
  age_days: number
}

export type OpenMaintenanceRequest = {
  request_id: string
  asset_name: string
  asset_tag: string
  priority: string
  status: string
  description: string
  created_at: string
  days_open: number
}

export type AssetsForAttention = {
  overdue_returns: OverdueReturn[] | null
  poor_condition: PoorConditionAsset[] | null
  open_maintenance: OpenMaintenanceRequest[] | null
  summary: AttentionSummary
}

export type DepartmentAllocationRow = {
  department_id: string
  department_name: string
  total_assets: number
  allocated: number
  available: number
  maintenance: number
  users_count: number
  active_bookings: number
  open_requests: number
}

export type HeatmapCell = {
  day_of_week: number
  hour: number
  count: number
}

export type TopResource = {
  asset_name: string
  asset_tag: string
  booking_count: number
  total_hours: number
}

export type MonthlyBooking = {
  month: string
  month_date: string
  total: number
  completed: number
  cancelled: number
}

export type BookingHeatmapData = {
  heatmap: HeatmapCell[] | null
  top_resources: TopResource[] | null
  monthly_bookings: MonthlyBooking[] | null
  stats: {
    total_bookings: number
    avg_duration_hrs: number
    utilization_rate: number
    unique_users: number
  }
}

export type ReportsSummary = {
  total_assets: number
  total_asset_value: number
  utilization_rate: number
  total_departments: number
  total_users: number
  total_bookings_30d: number
  total_maintenance_30d: number
  resolved_maintenance: number
  asset_status_breakdown: Record<string, number>
}

// ── Legacy KPIs ──────────────────────────────────────────────────────────────

export type DashboardKpis = {
  assets_available: number
  assets_allocated: number
  maintenance_today: number
  active_bookings: number
  pending_transfers: number
  upcoming_returns: number
  overdue_returns: number
}

export type AssetFilters = {
  status?: AssetStatus
  categoryId?: string
  departmentId?: string
  search?: string
  bookable?: boolean
  page?: number
  pageSize?: number
}

export type Database = {
  public: {
    Tables: {
      users: Table<User>
      departments: Table<Department>
      asset_categories: Table<AssetCategory>
      assets: Table<Asset>
      asset_documents: Table<AssetDocument>
      allocations: Table<Allocation>
      transfer_requests: Table<TransferRequest>
      bookings: Table<Booking>
      maintenance_requests: Table<MaintenanceRequest>
      audit_cycles: Table<AuditCycle>
      audit_items: Table<AuditItem>
    }
    Views: Record<string, never>
    Functions: {
      allocate_asset: {
        Args: {
          p_asset_id: string
          p_user_id?: string | null
          p_department_id?: string | null
          p_expected_return_date?: string | null
        }
        Returns: Allocation
      }
      book_resource: {
        Args: {
          p_resource_id: string
          p_start_time: string
          p_end_time: string
          p_purpose?: string | null
        }
        Returns: Booking
      }
      get_dashboard_kpis: {
        Args: Record<string, never>
        Returns: DashboardKpis
      }
      get_asset_utilization_trends: {
        Args: { p_months?: number }
        Returns: UtilizationTrendPoint[]
      }
      get_maintenance_stats: {
        Args: Record<string, never>
        Returns: MaintenanceStats
      }
      get_assets_due_for_attention: {
        Args: Record<string, never>
        Returns: AssetsForAttention
      }
      get_department_allocation_summary: {
        Args: Record<string, never>
        Returns: DepartmentAllocationRow[]
      }
      get_booking_heatmap: {
        Args: { p_days?: number }
        Returns: BookingHeatmapData
      }
      get_reports_summary: {
        Args: Record<string, never>
        Returns: ReportsSummary
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
