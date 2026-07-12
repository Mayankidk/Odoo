// ---------------------------------------------------------------------------
// AssetFlow — Centralised React Query Keys
// ---------------------------------------------------------------------------
// Every hook imports keys from here so cache invalidation after mutations
// always targets the correct scope. Use the factory functions to build
// scoped keys (e.g. `queryKeys.assets.detail(id)`).
// ---------------------------------------------------------------------------

export const queryKeys = Object.freeze({
  departments: {
    all: ['departments'],
    lists: () => [...queryKeys.departments.all, 'list'],
    list: (filters) => [...queryKeys.departments.lists(), filters],
    details: () => [...queryKeys.departments.all, 'detail'],
    detail: (id) => [...queryKeys.departments.details(), id],
  },

  categories: {
    all: ['categories'],
    lists: () => [...queryKeys.categories.all, 'list'],
    list: (filters) => [...queryKeys.categories.lists(), filters],
    details: () => [...queryKeys.categories.all, 'detail'],
    detail: (id) => [...queryKeys.categories.details(), id],
  },

  employees: {
    all: ['employees'],
    lists: () => [...queryKeys.employees.all, 'list'],
    list: (filters) => [...queryKeys.employees.lists(), filters],
    details: () => [...queryKeys.employees.all, 'detail'],
    detail: (id) => [...queryKeys.employees.details(), id],
  },

  assets: {
    all: ['assets'],
    lists: () => [...queryKeys.assets.all, 'list'],
    list: (filters) => [...queryKeys.assets.lists(), filters],
    details: () => [...queryKeys.assets.all, 'detail'],
    detail: (id) => [...queryKeys.assets.details(), id],
  },

  allocations: {
    all: ['allocations'],
    lists: () => [...queryKeys.allocations.all, 'list'],
    list: (filters) => [...queryKeys.allocations.lists(), filters],
    details: () => [...queryKeys.allocations.all, 'detail'],
    detail: (id) => [...queryKeys.allocations.details(), id],
  },

  transferRequests: {
    all: ['transferRequests'],
    lists: () => [...queryKeys.transferRequests.all, 'list'],
    list: (filters) => [...queryKeys.transferRequests.lists(), filters],
  },

  bookings: {
    all: ['bookings'],
    lists: () => [...queryKeys.bookings.all, 'list'],
    list: (filters) => [...queryKeys.bookings.lists(), filters],
    details: () => [...queryKeys.bookings.all, 'detail'],
    detail: (id) => [...queryKeys.bookings.details(), id],
    calendar: (range) => [...queryKeys.bookings.all, 'calendar', range],
  },

  maintenance: {
    all: ['maintenance'],
    lists: () => [...queryKeys.maintenance.all, 'list'],
    list: (filters) => [...queryKeys.maintenance.lists(), filters],
    details: () => [...queryKeys.maintenance.all, 'detail'],
    detail: (id) => [...queryKeys.maintenance.details(), id],
  },

  auditCycles: {
    all: ['auditCycles'],
    lists: () => [...queryKeys.auditCycles.all, 'list'],
    list: (filters) => [...queryKeys.auditCycles.lists(), filters],
    details: () => [...queryKeys.auditCycles.all, 'detail'],
    detail: (id) => [...queryKeys.auditCycles.details(), id],
  },

  auditItems: {
    all: ['auditItems'],
    lists: () => [...queryKeys.auditItems.all, 'list'],
    list: (cycleId) => [...queryKeys.auditItems.lists(), cycleId],
  },

  notifications: {
    all: ['notifications'],
    lists: () => [...queryKeys.notifications.all, 'list'],
    list: (filters) => [...queryKeys.notifications.lists(), filters],
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'],
  },

  dashboard: {
    all: ['dashboard'],
    kpis: () => [...queryKeys.dashboard.all, 'kpis'],
    overdueReturns: () => [...queryKeys.dashboard.all, 'overdueReturns'],
    pendingApprovals: () => [...queryKeys.dashboard.all, 'pendingApprovals'],
  },

  auditLogs: {
    all: ['auditLogs'],
    lists: () => [...queryKeys.auditLogs.all, 'list'],
    list: (filters) => [...queryKeys.auditLogs.lists(), filters],
  },
});
