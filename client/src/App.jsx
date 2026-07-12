import { useState } from 'react';
import {
  useDashboardKPIs,
  useAssets,
  useEmployees,
  useDepartments,
} from '@/hooks/queries';
import { useAllocateAsset } from '@/hooks/mutations';
import { parseSupabaseError } from '@/utils/errors';
import './App.css';

function App() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [allocatingAsset, setAllocatingAsset] = useState(null);
  
  // Form State
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Environment Check
  const isMockActive = import.meta.env.VITE_USE_MOCK_DATA === 'true';

  // 🔍 Data Queries
  const { data: kpis, isLoading: isKpiLoading } = useDashboardKPIs();
  const { data: assetsData, isLoading: isAssetsLoading } = useAssets({
    search,
    page,
    pageSize: 5,
  });
  const { data: employees } = useEmployees({ status: 'active' });
  const { data: departments } = useDepartments();


  // ⚡ Data Mutation
  const allocate = useAllocateAsset();

  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    if (!allocatingAsset) return;

    if (!selectedUser && !selectedDept) {
      addToast('Please select either an employee OR a department.', 'error');
      return;
    }

    allocate.mutate(
      {
        assetId: allocatingAsset.id,
        userId: selectedUser || null,
        departmentId: selectedDept || null,
        expectedReturnDate: returnDate || null,
      },
      {
        onSuccess: () => {
          addToast(`Successfully allocated ${allocatingAsset.name}!`);
          setAllocatingAsset(null);
          setSelectedUser('');
          setSelectedDept('');
          setReturnDate('');
        },
        onError: (err) => {
          const friendlyMessage = parseSupabaseError(err);
          addToast(friendlyMessage, 'error');
        },
      }
    );
  };

  return (
    <div className="dashboard-container">
      {/* Toast Alert Stack */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Header Banner */}
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>AssetFlow Integration</h1>
          <p className="dashboard-subtitle">
            Admin Workspace &amp; Data Access Layer Contract validation (M2)
          </p>
        </div>
        <div>
          {isMockActive ? (
            <span className="env-badge mock">
              <span className="pulse-dot"></span>
              Local Mock Database Active
            </span>
          ) : (
            <span className="env-badge live">
              <span className="pulse-dot"></span>
              Supabase Backend Connected
            </span>
          )}
        </div>
      </header>

      {/* KPI Counters Grid */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Available Assets</div>
          <div className="kpi-value">
            {isKpiLoading ? '...' : kpis?.assets_available ?? 0}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Allocated Assets</div>
          <div className="kpi-value">
            {isKpiLoading ? '...' : kpis?.assets_allocated ?? 0}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Bookings</div>
          <div className="kpi-value">
            {isKpiLoading ? '...' : kpis?.active_bookings ?? 0}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pending Transfers</div>
          <div className="kpi-value">
            {isKpiLoading ? '...' : kpis?.pending_transfers ?? 0}
          </div>
        </div>
      </section>

      {/* Main Directory Table */}
      <section className="directory-section">
        <div className="directory-controls">
          <h2>Assets Inventory</h2>
          <input
            type="text"
            className="search-input"
            placeholder="Search by tag, name, or serial number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0); // Reset page on search
            }}
          />
        </div>

        <div className="assets-table-wrapper">
          <table className="assets-table">
            <thead>
              <tr>
                <th>Tag ID</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isAssetsLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading assets from data hooks...
                  </td>
                </tr>
              ) : !assetsData?.data || assetsData.data.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                    No assets found.
                  </td>
                </tr>
              ) : (
                assetsData.data.map((asset) => (
                  <tr key={asset.id}>
                    <td><code>{asset.asset_tag}</code></td>
                    <td><strong>{asset.name}</strong></td>
                    <td>{asset.category?.name ?? 'General'}</td>
                    <td>{asset.location ?? 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${asset.status}`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        disabled={asset.status !== 'available'}
                        onClick={() => setAllocatingAsset(asset)}
                      >
                        Allocate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-controls">
          <span style={{ fontSize: '14px' }}>
            Showing page {page + 1} of{' '}
            {Math.ceil((assetsData?.count ?? 0) / 5) || 1}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="action-btn"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <button
              className="action-btn"
              disabled={
                page >= Math.ceil((assetsData?.count ?? 0) / 5) - 1
              }
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Allocation Drawer/Form */}
      {allocatingAsset && (
        <section className="allocation-form-wrapper">
          <h3>Allocate Asset: {allocatingAsset.name} (Tag: {allocatingAsset.asset_tag})</h3>
          <form onSubmit={handleAllocateSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Option A: Select Employee Holder</label>
                <select
                  className="form-select"
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    if (e.target.value) setSelectedDept(''); // Clear department
                  }}
                >
                  <option value="">-- Choose Employee --</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Option B: Select Department Holder</label>
                <select
                  className="form-select"
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    if (e.target.value) setSelectedUser(''); // Clear employee
                  }}
                >
                  <option value="">-- Choose Department --</option>
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} {dept.status === 'inactive' ? ' (Inactive)' : ''}
                    </option>
                  ))}

                </select>
              </div>

              <div className="form-group">
                <label>Expected Return Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={returnDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="action-btn"
                onClick={() => setAllocatingAsset(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="action-btn primary"
                disabled={allocate.isPending}
              >
                {allocate.isPending ? 'Allocating...' : 'Confirm Allocation'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

export default App;
