import { useState } from 'react';
import { DepartmentForm } from './03-department-form';
import { AssetCategoryForm } from './04-asset-category-form';

function EmptyState({ children }) {
  return <p role="status">{children}</p>;
}

/**
 * M4 Organization Setup
 *
 * M2 supplies data plus mutations. `onSaveDepartment` and `onSaveCategory`
 * receive (payload, id); an omitted id means create and an id means update.
 */
export function OrganizationSetup({
  departments = [],
  categories = [],
  employees = [],
  isLoading = false,
  isSavingDepartment = false,
  isSavingCategory = false,
  onSaveDepartment,
  onSaveCategory,
}) {
  const [activeTab, setActiveTab] = useState('departments');
  const [departmentBeingEdited, setDepartmentBeingEdited] = useState(null);
  const [categoryBeingEdited, setCategoryBeingEdited] = useState(null);
  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

  function openNewDepartment() {
    setDepartmentBeingEdited(null);
    setIsDepartmentFormOpen(true);
  }

  function openEditDepartment(department) {
    setDepartmentBeingEdited(department);
    setIsDepartmentFormOpen(true);
  }

  function openNewCategory() {
    setCategoryBeingEdited(null);
    setIsCategoryFormOpen(true);
  }

  function openEditCategory(category) {
    setCategoryBeingEdited(category);
    setIsCategoryFormOpen(true);
  }

  async function saveDepartment(payload, id) {
    await onSaveDepartment?.(payload, id);
    setIsDepartmentFormOpen(false);
    setDepartmentBeingEdited(null);
  }

  async function saveCategory(payload, id) {
    await onSaveCategory?.(payload, id);
    setIsCategoryFormOpen(false);
    setCategoryBeingEdited(null);
  }

  return (
    <section aria-labelledby="organization-setup-title">
      <header>
        <h1 id="organization-setup-title">Organization setup</h1>
        <p>Manage departments and asset categories used across AssetFlow.</p>
      </header>

      <div role="tablist" aria-label="Organization setup sections">
        <button
          id="departments-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'departments'}
          aria-controls="departments-panel"
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
        <button
          id="categories-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'categories'}
          aria-controls="categories-panel"
          onClick={() => setActiveTab('categories')}
        >
          Asset categories
        </button>
      </div>

      {activeTab === 'departments' && (
        <div id="departments-panel" role="tabpanel" aria-labelledby="departments-tab">
          <div>
            <h2>Departments</h2>
            <button type="button" onClick={openNewDepartment}>Add department</button>
          </div>

          {isLoading ? (
            <EmptyState>Loading departments…</EmptyState>
          ) : departments.length === 0 ? (
            <EmptyState>No departments yet. Create the first department to get started.</EmptyState>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Parent department</th>
                  <th scope="col">Department head</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.id}>
                    <td>{department.name}</td>
                    <td>{department.parent_department?.name ?? '—'}</td>
                    <td>{department.department_head?.name ?? 'Unassigned'}</td>
                    <td>{department.status}</td>
                    <td>
                      <button type="button" onClick={() => openEditDepartment(department)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {isDepartmentFormOpen && (
            <div role="dialog" aria-modal="true" aria-label={departmentBeingEdited ? 'Edit department' : 'Create department'}>
              <DepartmentForm
                department={departmentBeingEdited}
                departments={departments}
                employees={employees}
                isSubmitting={isSavingDepartment}
                onCancel={() => setIsDepartmentFormOpen(false)}
                onSubmit={saveDepartment}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div id="categories-panel" role="tabpanel" aria-labelledby="categories-tab">
          <div>
            <h2>Asset categories</h2>
            <button type="button" onClick={openNewCategory}>Add category</button>
          </div>

          {isLoading ? (
            <EmptyState>Loading asset categories…</EmptyState>
          ) : categories.length === 0 ? (
            <EmptyState>No asset categories yet. Create a category before registering assets.</EmptyState>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Description</th>
                  <th scope="col">Custom fields</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.description || '—'}</td>
                    <td>{Object.keys(category.custom_fields_schema ?? {}).length}</td>
                    <td>{category.status}</td>
                    <td>
                      <button type="button" onClick={() => openEditCategory(category)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {isCategoryFormOpen && (
            <div role="dialog" aria-modal="true" aria-label={categoryBeingEdited ? 'Edit asset category' : 'Create asset category'}>
              <AssetCategoryForm
                category={categoryBeingEdited}
                isSubmitting={isSavingCategory}
                onCancel={() => setIsCategoryFormOpen(false)}
                onSubmit={saveCategory}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
