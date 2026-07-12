# AssetFlow — Frontend Architecture (React + Supabase)

Since we are utilizing a Backend-as-a-Service (Supabase), the architecture is entirely frontend-driven. The React application handles routing, UI state, form validation, and directly consumes the Supabase API.

## 1. Folder Structure

```
client/
├── public/
│   ├── favicon.ico
│   └── assets/              # Static images, icons
├── src/
│   ├── main.jsx             # App entry point
│   ├── App.jsx              # Root component, router setup
│   ├── index.css            # Global styles, CSS variables
│   │
│   ├── config/
│   │   ├── constants.js     # App-wide constants (roles, statuses)
│   │   ├── routes.js        # Route path definitions
│   │   └── supabase.js      # Supabase client initialization
│   │
│   ├── stores/
│   │   ├── authStore.js     # Zustand: current user, role, session
│   │   └── uiStore.js       # Zustand: sidebar state, theme
│   │
│   ├── hooks/
│   │   ├── queries/         # React Query hooks for fetching (GET)
│   │   │   ├── useAssets.js
│   │   │   ├── useBookings.js
│   │   │   └── useDepartments.js
│   │   ├── mutations/       # React Query hooks for modifying (POST/PATCH/DELETE)
│   │   │   ├── useAllocateAsset.js
│   │   │   ├── useBookResource.js
│   │   │   └── useUpdateMaintenance.js
│   │   ├── useAuth.js       # Wraps Supabase Auth + Zustand
│   │   └── useDebounce.js   # Search debouncing
│   │
│   ├── contexts/
│   │   └── AuthProvider.jsx # Listens to Supabase auth state changes
│   │
│   ├── components/
│   │   ├── ui/              # Base UI components (Button, Input, Modal, etc.)
│   │   ├── layout/          # AppLayout, Sidebar, Header, ProtectedRoute
│   │   ├── dashboard/
│   │   ├── assets/
│   │   ├── allocations/
│   │   ├── bookings/
│   │   ├── maintenance/
│   │   ├── audits/
│   │   └── organization/
│   │
│   ├── pages/               # Top-level route components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AssetDirectoryPage.jsx
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── formatters.js    # Date, currency, status formatting
│   │   └── permissions.js   # Role-based UI visibility helpers
│   │
│   └── styles/
│       ├── variables.css    # CSS custom properties
│       └── components.css   
│
├── .env                     # Supabase URL and Anon Key
├── .env.example
├── vite.config.js
├── package.json
└── README.md
```

## 2. API Interaction Strategy (Supabase Client)

Instead of `axios`, all data fetching and mutations use the `@supabase/supabase-js` client, wrapped in **React Query (TanStack Query)** to handle caching, loading states, and error states.

### Example: Fetching Data (Hook)
```javascript
// src/hooks/queries/useAssets.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';

export function useAssets(filters) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: async () => {
      let query = supabase.from('assets').select(`
        *,
        category:categories(name),
        department:departments(name)
      `);
      
      if (filters.status) query = query.eq('status', filters.status);
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    }
  });
}
```

### Example: Mutating Data (Hook)
```javascript
// src/hooks/mutations/useAllocateAsset.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';

export function useAllocateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (allocationData) => {
      const { data, error } = await supabase
        .from('allocations')
        .insert([allocationData])
        .select();
        
      if (error) throw new Error(error.message);
      
      // Update asset status
      await supabase
        .from('assets')
        .update({ status: 'allocated' })
        .eq('id', allocationData.asset_id);
        
      return data;
    },
    onSuccess: () => {
      // Invalidate cache so UI refreshes automatically
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    }
  });
}
```

## 3. State Management

| Concern | Tool | Why |
|---------|------|-----|
| Auth State | Supabase Auth + Zustand | `onAuthStateChange` listener updates a Zustand store globally. |
| Server Data | React Query | Auto-caching, background refetching, completely replaces Redux. |
| UI State | Zustand | Lightweight for sidebar toggles, theme settings. |
| Form State | React Hook Form | High performance (avoids re-renders on every keystroke). |

## 4. Routing and Protection

Routes are handled by `react-router-dom`. We use a `<ProtectedRoute>` wrapper that checks the user's role from the Zustand auth store and redirects them if they lack permissions.

```jsx
// src/components/layout/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isLoading } = useAuthStore();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}
```
