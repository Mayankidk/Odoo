# 📘 AssetFlow Data Layer & Integration Guide (M2)

This documentation defines the interface contract for UI Developers (**M3 & M4**) to interact with the database, authentication models, and files. **Do not import `supabase` directly into your components.** Instead, use the custom query and mutation hooks detailed below.

---

## ⚙️ Environment Configurations

The application supports both a real Supabase backend connection and a fully offline/local mock database.

Copy [.env.example](file:///c:/Users/acer/OneDrive/Desktop/Hackathon/Odoo/client/.env.example) to `.env` in the `client/` root:

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_USE_MOCK_DATA=true
```

> [!NOTE]
> If `VITE_USE_MOCK_DATA` is set to `true`, all queries and mutations will run locally against our mock database using simulated network latency (400ms). This allows full front-end engineering offline or while migrations are in progress.

---

## 🔍 Data Queries

All queries are cached and managed using TanStack Query. Import queries directly from `@/hooks/queries`.

### 1. Assets Directory (`useAssets`, `useAsset`)

*   **List paginated assets:**
    ```javascript
    import { useAssets } from '@/hooks/queries';

    const { data, isLoading, error } = useAssets({
      page: 0,
      pageSize: 25,
      status: 'available',      // Optional status filter
      categoryId: 'cat-1',      // Optional category filter
      search: 'MacBook'         // Optional string search (name, tag, serial number)
    });

    // Returns: { data: Array<Asset>, count: number, page: number, pageSize: number }
    ```
*   **Asset Details:**
    ```javascript
    const { data: asset } = useAsset('asset-uuid');
    // Returns detailed Asset object including allocation history, documents, and maintenance logs.
    ```

### 2. Department Management (`useDepartments`, `useDepartment`)
*   **List departments:**
    ```javascript
    const { data: departments } = useDepartments({ status: 'active', search: 'Eng' });
    ```

### 3. Allocation Directory (`useAllocations`, `useMyAllocations`)
*   **List Allocations:**
    ```javascript
    const { data: allocations } = useAllocations({ status: 'active', overdue: true });
    ```
*   **Get My Assets:** Use this hook on user profiles or employee dashboards.
    ```javascript
    const { data: myAssets, isLoading } = useMyAllocations();
    // Scopes down automatically to the logged-in user's active allocations
    ```

### 4. Shared Resource Bookings (`useBookings`, `useResourceCalendar`, `useMyBookings`)
*   **Resource Calendar View:** Fetch slots for a bookable resource.
    ```javascript
    const { data: calendarSlots } = useResourceCalendar('resource-id', {
      from: '2026-07-01T00:00:00Z',
      to: '2026-07-31T23:59:59Z'
    });
    ```

### 5. Dashboard KPIs (`useDashboardKPIs`)
*   **Retrieve counts and alerts:**
    ```javascript
    const { data: kpis } = useDashboardKPIs();
    /* Returns: 
       { 
         assets_available: number, 
         assets_allocated: number, 
         maintenance_today: number, 
         active_bookings: number, 
         pending_transfers: number, 
         upcoming_returns: number, 
         overdue_returns: number 
       } 
    */
    ```

---

## ⚡ Data Mutations

Import mutations from `@/hooks/mutations`. Successful mutations **automatically invalidate** relevant query keys, trigger refetches, and update the UI.

### Invalidation Table
When you execute these mutations, the cache is automatically invalidated according to the following rules:

| Mutation Hook | Target Invalidation Query Keys |
|---|---|
| `useRegisterAsset`, `useUpdateAsset`, `useDeleteAsset` | `['assets']`, `['dashboard']` |
| `useAllocateAsset` | `['allocations']`, `['assets']`, `['dashboard']` |
| `useReturnAsset` | `['allocations']`, `['assets']`, `['dashboard']` |
| `useBookResource`, `useCancelBooking` | `['bookings']`, `['assets']`, `['dashboard']` |
| `useRaiseMaintenanceRequest`, `useResolveMaintenanceRequest` | `['maintenance']`, `['assets']`, `['dashboard']` |
| `useVerifyAuditItem`, `useUpdateAuditCycleStatus` | `['auditItems']`, `['auditCycles']`, `['assets']`, `['dashboard']` |

### In-Code Usage Example

```javascript
import { useAllocateAsset } from '@/hooks/mutations';
import { parseSupabaseError } from '@/utils/errors';

const allocate = useAllocateAsset();

const handleAllocate = (assetId, userId) => {
  allocate.mutate({
    assetId,
    userId,
    expectedReturnDate: '2026-08-30'
  }, {
    onSuccess: (data) => {
      // Invalidation is handled automatically! Show toast alert
      showToast('Asset allocated successfully!', 'success');
    },
    onError: (err) => {
      // Translate complex postgres/RLS constraints to friendly messages
      showToast(parseSupabaseError(err), 'error');
    }
  });
};
```

---

## 📂 File Storage Uploads

To upload PDF documents, invoices, or device images, use the storage helper.

```javascript
import { uploadAssetDocument } from '@/utils/storage';
import { useAddAssetDocuments } from '@/hooks/mutations';

const handleFileUpload = async (file, assetId) => {
  try {
    // 1. Upload to Supabase Bucket 'asset-documents' (automatically validated <10MB and PDF/PNG/JPEG)
    const fileMeta = await uploadAssetDocument(file);
    
    // 2. Save document reference in the asset_documents database table
    await addDocMutation.mutateAsync([
      {
        asset_id: assetId,
        ...fileMeta
      }
    ]);
    
    showToast('File uploaded successfully!');
  } catch (error) {
    showToast(parseSupabaseError(error), 'error');
  }
};
```

---

## 🚨 Error Handling Strategy

Always pass errors thrown by hooks or utilities into `parseSupabaseError`. It translates SQL errors, check constraints, and backend custom validations:

```javascript
import { parseSupabaseError } from '@/utils/errors';

try {
  await someAction();
} catch (error) {
  const toastMessage = parseSupabaseError(error);
  // Example: "Schedule Conflict: This resource is already booked by someone else during the selected time slot."
  triggerToast(toastMessage, 'error');
}
```
