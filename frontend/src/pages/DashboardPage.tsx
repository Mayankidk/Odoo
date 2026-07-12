export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your organization's assets and activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards Placeholder */}
        {['Total Assets', 'Available', 'In Use', 'Maintenance'].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">{stat}</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {Math.floor(Math.random() * 1000)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Allocations</h2>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
            Chart / Table Placeholder
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Requests</h2>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
            List Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
