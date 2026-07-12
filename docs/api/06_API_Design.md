# AssetFlow — API Design (Supabase JS Client)

Because AssetFlow uses Supabase as a Backend-as-a-Service, we do not hit traditional custom REST endpoints (e.g., `/api/v1/assets`). Instead, the React frontend uses the `@supabase/supabase-js` SDK. Supabase automatically translates these SDK calls into REST API requests (via PostgREST) against the database.

This document outlines how the frontend will fetch and mutate data using the Supabase Client.

## Initialization

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## 1. Authentication

Supabase handles JWT generation, password hashing, and session management automatically.

### Signup (Employee Only)
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'anita@example.com',
  password: 'securePassword123',
  options: {
    data: {
      name: 'Anita Desai',
      // Note: role is omitted. Database triggers will force the default 'employee' role.
    }
  }
});
```

### Login
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'anita@example.com',
  password: 'securePassword123',
});
// JWT is automatically stored in local storage and attached to future requests.
```

### Logout
```javascript
const { error } = await supabase.auth.signOut();
```

---

## 2. Reading Data (Queries)

Data fetching relies on Supabase's chained query builder. These will be wrapped in React Query hooks.

### Get Dashboard KPIs (Calling a Database Function)
Because KPIs require complex aggregations across multiple tables, we call a PostgreSQL function (RPC).
```javascript
const { data: kpis, error } = await supabase.rpc('get_dashboard_kpis');
// Returns: { assets_available: 142, active_bookings: 12, ... }
```

### List Assets with Filters and Pagination
```javascript
let query = supabase
  .from('assets')
  .select(`
    *,
    category:categories(name),
    department:departments(name)
  `, { count: 'exact' })
  .range(0, 19); // Pagination: Page 1, Limit 20

if (statusFilter) query = query.eq('status', statusFilter);
if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);

const { data: assets, count, error } = await query;
```

### Get Asset Details (with related history)
```javascript
const { data: asset, error } = await supabase
  .from('assets')
  .select(`
    *,
    allocations ( id, expected_return_date, users(name) ),
    maintenance_requests ( id, status, description )
  `)
  .eq('id', assetId)
  .single();
```

---

## 3. Mutating Data (Inserts & Updates)

Mutations are subject to Row Level Security (RLS). If an `employee` tries to run a mutation restricted to `asset_manager`, Supabase will return an error automatically.

### Register a New Asset
```javascript
const { data, error } = await supabase
  .from('assets')
  .insert([
    {
      name: 'Dell XPS 15',
      category_id: categoryId,
      condition: 'new',
      // registered_by is inferred from the auth.uid() by a Postgres trigger
    }
  ])
  .select();
```

### Allocate an Asset (Conflict Detection via RPC)
Because we need to check if the asset is *already* allocated before allocating it (to prevent race conditions), we use a database function that handles the check and insert atomically.

```javascript
const { data, error } = await supabase.rpc('allocate_asset', {
  p_asset_id: assetId,
  p_user_id: userId,
  p_expected_return_date: '2026-07-01'
});

// If overlapping/already allocated, error.message will be:
// "ASSET_ALREADY_ALLOCATED: Currently held by Priya Sharma"
```

### Book a Shared Resource (Overlap Detection via RPC)
Booking relies on Postgres `tstzrange` EXCLUDE constraints. The RPC function attempts the insert; if the database constraint fails, it throws a specific error.

```javascript
const { data, error } = await supabase.rpc('book_resource', {
  p_resource_id: roomId,
  p_start_time: '2026-10-01T10:00:00Z',
  p_end_time: '2026-10-01T11:00:00Z',
  p_purpose: 'Team Meeting'
});

// error.message will contain the constraint violation if overlapping
```

### Update Maintenance Status
```javascript
const { error } = await supabase
  .from('maintenance_requests')
  .update({ 
    status: 'approved',
    assigned_technician_id: techId 
  })
  .eq('id', requestId);
```

---

## 4. File Uploads (Storage)

Photos and documents are uploaded directly from the React client to Supabase Storage.

### Upload Asset Photo
```javascript
const file = event.target.files[0];
const fileExt = file.name.split('.').pop();
const fileName = `${assetId}-${Math.random()}.${fileExt}`;

const { data, error } = await supabase.storage
  .from('asset-documents')
  .upload(`photos/${fileName}`, file);

if (!error) {
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('asset-documents')
    .getPublicUrl(`photos/${fileName}`);
    
  // Save URL to database
  await supabase.from('asset_documents').insert({
    asset_id: assetId,
    file_url: publicUrl
  });
}
```

---

## 5. Error Handling

Supabase returns standard PostgREST errors. React Query hooks should inspect `error.code` or `error.message` to display user-friendly toasts.

| PostgREST Code | Meaning | UI Response |
|----------------|---------|-------------|
| `23505` | Unique constraint violation | "This record already exists." |
| `23503` | Foreign key violation | "Invalid reference or department missing." |
| `42501` | RLS Policy Violation (Insufficient privilege) | "You do not have permission to perform this action." |
| `PGRST116` | Single row not found | "Resource not found (404)." |
| Custom | From RPC functions | e.g. "Booking overlaps with existing reservation." |

---
*Cross-references: [04_System_Design.md](../architecture/04_System_Design.md) | [05_Database_Design.md](../database/05_Database_Design.md)*
