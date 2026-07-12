// ---------------------------------------------------------------------------
// AssetFlow — Local Mock Database for Integration
// ---------------------------------------------------------------------------
// Used when VITE_USE_MOCK_DATA=true. Allows frontend M3/M4 UI developers
// to build and test layouts/flows even if the database is unseeded or offline.
// ---------------------------------------------------------------------------

// Helper to generate simulated network latency
export const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockDepartments = [
  { id: 'dept-1', name: 'Engineering', parent_department_id: null, department_head_id: 'emp-2', status: 'active' },
  { id: 'dept-2', name: 'Product & Design', parent_department_id: null, department_head_id: 'emp-3', status: 'active' },
  { id: 'dept-3', name: 'Operations & IT', parent_department_id: null, department_head_id: 'emp-1', status: 'active' },
  { id: 'dept-4', name: 'Frontend Web', parent_department_id: 'dept-1', department_head_id: 'emp-4', status: 'active' },
];

export const mockCategories = [
  { id: 'cat-1', name: 'Laptops', description: 'Workstation laptops for employees', custom_fields_schema: { ram: 'string', storage: 'string' }, status: 'active' },
  { id: 'cat-2', name: 'Monitors', description: 'External display monitors', custom_fields_schema: { resolution: 'string' }, status: 'active' },
  { id: 'cat-3', name: 'Mobile Devices', description: 'Smartphones and tablets for testing', custom_fields_schema: { os: 'string' }, status: 'active' },
  { id: 'cat-4', name: 'Conference Rooms', description: 'Shared meeting rooms and equipment', custom_fields_schema: { capacity: 'number' }, status: 'active' },
];

export const mockEmployees = [
  { id: 'emp-1', name: 'Dhruv Parmar', email: 'dhruv@assetflow.com', role: 'admin', department_id: 'dept-3', status: 'active' },
  { id: 'emp-2', name: 'Mayank Kumar', email: 'mayank@assetflow.com', role: 'asset_manager', department_id: 'dept-1', status: 'active' },
  { id: 'emp-3', name: 'Shabbir K', email: 'shabbir@assetflow.com', role: 'department_head', department_id: 'dept-2', status: 'active' },
  { id: 'emp-4', name: 'Jane Doe', email: 'jane.doe@assetflow.com', role: 'employee', department_id: 'dept-4', status: 'active' },
  { id: 'emp-5', name: 'John Smith', email: 'john.smith@assetflow.com', role: 'employee', department_id: 'dept-1', status: 'inactive' },
];

export const mockAssets = [
  { id: 'asset-1', asset_tag: 'AF-0001', name: 'MacBook Pro 16" M3', category_id: 'cat-1', serial_number: 'C02X87GBX8', acquisition_date: '2026-01-10', acquisition_cost: 2499.00, condition: 'new', location: 'HQ - Floor 3', status: 'allocated', is_bookable: false, registered_by: 'emp-1', department_id: 'dept-1', custom_fields: { ram: '32GB', storage: '1TB SSD' } },
  { id: 'asset-2', asset_tag: 'AF-0002', name: 'Dell UltraSharp 27" 4K', category_id: 'cat-2', serial_number: 'CN-0DF82-72', acquisition_date: '2026-02-15', acquisition_cost: 499.00, condition: 'good', location: 'HQ - Floor 3', status: 'available', is_bookable: false, registered_by: 'emp-2', department_id: 'dept-1', custom_fields: { resolution: '3840x2160' } },
  { id: 'asset-3', asset_tag: 'AF-0003', name: 'iPad Pro 11"', category_id: 'cat-3', serial_number: 'DLX8928392', acquisition_date: '2026-03-01', acquisition_cost: 899.00, condition: 'good', location: 'IT Lab Rack B', status: 'available', is_bookable: true, registered_by: 'emp-2', department_id: 'dept-3', custom_fields: { os: 'iPadOS' } },
  { id: 'asset-4', asset_tag: 'AF-0004', name: 'Boardroom A Conference Tech', category_id: 'cat-4', serial_number: 'CONF-BOARD-A', acquisition_date: '2026-01-01', acquisition_cost: 1500.00, condition: 'good', location: 'HQ - Room 402', status: 'available', is_bookable: true, registered_by: 'emp-1', department_id: 'dept-3', custom_fields: { capacity: 12 } },
  { id: 'asset-5', asset_tag: 'AF-0005', name: 'iPhone 15 Pro Test Unit', category_id: 'cat-3', serial_number: 'IPHONE15-09', acquisition_date: '2026-05-12', acquisition_cost: 999.00, condition: 'fair', location: 'IT Lab Drawer C', status: 'under_maintenance', is_bookable: false, registered_by: 'emp-2', department_id: 'dept-3', custom_fields: { os: 'iOS 17' } },
];

export const mockAllocations = [
  { id: 'alloc-1', asset_id: 'asset-1', allocated_to_user_id: 'emp-4', allocated_to_dept_id: null, allocated_by_id: 'emp-2', expected_return_date: '2026-12-31', actual_return_date: null, return_notes: null, condition_on_return: null, status: 'active', created_at: '2026-01-12T10:00:00Z' },
  { id: 'alloc-2', asset_id: 'asset-2', allocated_to_user_id: 'emp-5', allocated_to_dept_id: null, allocated_by_id: 'emp-2', expected_return_date: '2026-06-01', actual_return_date: '2026-05-30', return_notes: 'Returned in good condition.', condition_on_return: 'good', status: 'returned', created_at: '2026-02-16T10:00:00Z' },
];

export const mockTransferRequests = [
  { id: 'trans-1', allocation_id: 'alloc-1', requested_by_id: 'emp-2', approved_by_id: null, status: 'pending', reason: 'Need this MacBook for high-intensity processing tests.', rejection_reason: null, created_at: '2026-07-11T14:30:00Z' },
];

export const mockBookings = [
  { id: 'book-1', resource_id: 'asset-3', booked_by_id: 'emp-4', start_time: '2026-07-12T14:00:00Z', end_time: '2026-07-12T16:00:00Z', purpose: 'App testing session', status: 'upcoming', created_at: '2026-07-11T09:00:00Z' },
  { id: 'book-2', resource_id: 'asset-4', booked_by_id: 'emp-3', start_time: '2026-07-12T10:00:00Z', end_time: '2026-07-12T11:30:00Z', purpose: 'Weekly sync meeting', status: 'completed', created_at: '2026-07-10T12:00:00Z' },
];

export const mockMaintenanceRequests = [
  { id: 'maint-1', asset_id: 'asset-5', raised_by_id: 'emp-4', approved_by_id: 'emp-2', assigned_technician_id: 'emp-1', description: 'Screen flickering occasionally during testing.', priority: 'medium', status: 'in_progress', resolution_notes: null, resolved_at: null, created_at: '2026-07-10T08:30:00Z' },
];

export const mockAuditCycles = [
  { id: 'audit-c-1', name: 'Q3 IT Equipment Inventory', scope_type: 'location', scope_id: null, scope_location: 'HQ - Floor 3', start_date: '2026-07-01', end_date: '2026-07-31', status: 'in_progress', created_by_id: 'emp-1', created_at: '2026-06-30T10:00:00Z' },
];

export const mockAuditItems = [
  { id: 'audit-i-1', audit_cycle_id: 'audit-c-1', asset_id: 'asset-1', verified_by_id: 'emp-2', verification_status: 'verified', notes: 'Verified in person, good condition.', verified_at: '2026-07-05T11:00:00Z', created_at: '2026-06-30T10:00:00Z' },
  { id: 'audit-i-2', audit_cycle_id: 'audit-c-1', asset_id: 'asset-2', verified_by_id: null, verification_status: 'pending', notes: null, verified_at: null, created_at: '2026-06-30T10:00:00Z' },
];

export const mockNotifications = [
  { id: 'notif-1', user_id: 'emp-4', type: 'asset_assigned', title: 'Asset Allocated', message: 'MacBook Pro 16" has been successfully allocated to you.', metadata: { asset_id: 'asset-1' }, is_read: false, created_at: '2026-07-12T10:05:00Z' },
  { id: 'notif-2', user_id: 'emp-3', type: 'booking_confirmed', title: 'Booking Confirmed', message: 'Your booking for Boardroom A has been confirmed.', metadata: { booking_id: 'book-2' }, is_read: true, created_at: '2026-07-10T12:00:00Z' },
];

export const mockDashboardKPIs = {
  assets_available: 3,
  assets_allocated: 1,
  maintenance_today: 0,
  active_bookings: 1,
  pending_transfers: 1,
  upcoming_returns: 0,
  overdue_returns: 0,
};
