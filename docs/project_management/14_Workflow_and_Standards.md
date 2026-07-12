# AssetFlow — Git Workflow & Coding Standards (BaaS)

To move fast without breaking things during a 48-hour hackathon, the team will adhere to a simplified workflow and strict formatting standards tailored for a React + Supabase project.

---

## 1. Git Workflow

### Branching Strategy (Simplified GitHub Flow)
- `main`: Production-ready code. Auto-deploys to GitHub Pages via Actions. Never push directly to `main`.
- `develop`: Integration branch. Auto-deploys to staging environment (if configured).
- `feature/*`: For new UI features (e.g., `feature/asset-registration`).
- `fix/*`: For bug fixes (e.g., `fix/allocation-rpc-error`).

### Commit Conventions (Conventional Commits)
Format: `type(scope): description`
- `feat(auth): hook up supabase login`
- `fix(booking): prevent overlapping time slots via RPC`
- `ui(dashboard): update KPI card layout`
- `chore(deps): install tailwind css`
- `db(schema): add RLS policies for allocations table`

### Pull Request Process
1. Push your feature branch.
2. Open a PR against `develop`.
3. Inform the team on Discord/Slack.
4. **Hackathon Rule**: 1 approval required. If it's 3 AM and everyone is asleep, self-merge is allowed *only* if local tests pass and the React app builds successfully (`npm run build`).

---

## 2. Supabase & Database Standards

Because we do not have a backend codebase, the database *is* our backend. We must treat SQL with the same rigor as application code.

### Schema Management
- Do not make random changes in the Supabase UI without telling the team.
- All schema changes, RLS policies, and RPC functions should be written in `.sql` files stored in a `supabase/migrations` folder in the repository, even if applied manually via the Supabase UI for speed. This acts as our source of truth.

### Naming Conventions
- **Tables**: `snake_case`, plural (e.g., `maintenance_requests`)
- **Columns**: `snake_case` (e.g., `created_at`, `asset_id`)
- **RPC Functions**: `snake_case` starting with a verb (e.g., `allocate_asset`, `get_dashboard_kpis`)
- **RLS Policies**: Descriptive sentence case (e.g., "Asset Managers can insert", "Users can view own allocations")

### Security Rule
- **Never expose the Supabase `service_role` key.** Only the `anon` key should ever be in the frontend `.env` file. Security is handled via RLS, not by hiding the API key.

---

## 3. Coding Standards (Frontend React)

### Naming Conventions
- **Components**: `PascalCase` (e.g., `AssetCard.jsx`, `BookingModal.jsx`)
- **Hooks**: `camelCase` starting with `use` (e.g., `useAuth.js`, `useAssets.js`)
- **Props**: `camelCase` (e.g., `onStatusChange`, `isBookable`)
- **CSS Classes**: `kebab-case` (handled mostly by Tailwind).

### Component Structure
1. Imports (React, third-party, local components, styles).
2. Props interface (if using TS/JSDoc).
3. Component definition.
4. Hooks execution (State, Context, React Query hooks).
5. Derived state / Helper functions.
6. Return statement (JSX).

```jsx
// Example
import { useState } from 'react';
import { useAssets } from '@/hooks/queries/useAssets';
import Button from '@/components/ui/Button';

export default function AssetList({ categoryId }) {
  // Hooks
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAssets({ categoryId, page });

  // Helpers
  const handleNextPage = () => setPage(p => p + 1);

  // Render
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error.message} />;
  
  return (
    <div>
      {/* JSX rendering data */}
    </div>
  );
}
```

### State Management Rules
- **Local UI state** (is modal open? typed search query?) -> `useState`
- **Global UI/Auth state** (sidebar open? current user?) -> `Zustand`
- **Server data** (asset list, bookings) -> `React Query`. (Never store Supabase fetch results in Zustand if avoidable).

### Supabase Error Handling
- Never silence Supabase errors. React Query hooks should throw the error so the UI can catch it and display a Toast notification.
```javascript
// BAD
const { data, error } = await supabase.from('assets').select('*');
if (error) console.error(error); // User doesn't know it failed!

// GOOD
const { data, error } = await supabase.from('assets').select('*');
if (error) throw new Error(error.message); // Caught by React Query's onError
```

---

## 4. Formatting & Linting (Automated)

Do not waste hackathon time arguing over tabs vs spaces. Let the machines do it.

### Prettier Config (`.prettierrc`)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### ESLint Strategy
- Use `eslint-config-react-app` for the Vite project.
- Configure VS Code (or your IDE) to "Format on Save" so all code committed is automatically compliant.
