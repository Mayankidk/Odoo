import { useEffect, useState } from 'react';
import { ASSET_STATUSES } from './02-validation-schemas';

const EMPTY_FILTERS = {
  search: '',
  categoryId: '',
  status: '',
  departmentId: '',
  location: '',
};

/**
 * M4 Asset Directory: filters and base result table.
 *
 * The parent connects `onFiltersChange` to M2's useAssets arguments. This
 * component deliberately does not own pagination or row actions; task 9 extends
 * the directory with those behaviors.
 */
export function AssetDirectoryTable({
  assets = [],
  categories = [],
  departments = [],
  filters: externalFilters,
  isLoading = false,
  onFiltersChange,
}) {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...externalFilters });

  useEffect(() => {
    setFilters({ ...EMPTY_FILTERS, ...externalFilters });
  }, [externalFilters]);

  const activeCategories = categories.filter((category) => category.status === 'active');
  const activeDepartments = departments.filter((department) => department.status === 'active');

  function updateFilter(name, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    onFiltersChange?.(filters);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    onFiltersChange?.(EMPTY_FILTERS);
  }

  return (
    <section aria-labelledby="asset-directory-title">
      <header>
        <h1 id="asset-directory-title">Asset directory</h1>
        <p>Find assets by name, asset tag, serial number, category, status, department, or location.</p>
      </header>

      <form onSubmit={applyFilters} aria-label="Asset directory filters">
        <div>
          <label htmlFor="asset-search">Search</label>
          <input
            id="asset-search"
            type="search"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Name, asset tag, or serial number"
          />
        </div>

        <div>
          <label htmlFor="asset-category-filter">Category</label>
          <select
            id="asset-category-filter"
            value={filters.categoryId}
            onChange={(event) => updateFilter('categoryId', event.target.value)}
          >
            <option value="">All categories</option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="asset-status-filter">Status</label>
          <select
            id="asset-status-filter"
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="">All statuses</option>
            {ASSET_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="asset-department-filter">Department</label>
          <select
            id="asset-department-filter"
            value={filters.departmentId}
            onChange={(event) => updateFilter('departmentId', event.target.value)}
          >
            <option value="">All departments</option>
            {activeDepartments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="asset-location-filter">Location</label>
          <input
            id="asset-location-filter"
            type="text"
            value={filters.location}
            onChange={(event) => updateFilter('location', event.target.value)}
            placeholder="e.g. Mumbai Office"
          />
        </div>

        <div>
          <button type="submit">Apply filters</button>
          <button type="button" onClick={resetFilters}>Clear filters</button>
        </div>
      </form>

      {isLoading ? (
        <p role="status">Loading assets…</p>
      ) : assets.length === 0 ? (
        <p role="status">No assets match the selected filters.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Asset tag</th>
              <th scope="col">Name</th>
              <th scope="col">Serial number</th>
              <th scope="col">Category</th>
              <th scope="col">Department</th>
              <th scope="col">Location</th>
              <th scope="col">Status</th>
              <th scope="col">Bookable</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td>{asset.asset_tag}</td>
                <td>{asset.name}</td>
                <td>{asset.serial_number || '—'}</td>
                <td>{asset.category?.name ?? '—'}</td>
                <td>{asset.department?.name ?? '—'}</td>
                <td>{asset.location || '—'}</td>
                <td>{asset.status}</td>
                <td>{asset.is_bookable ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
