# AssetFlow — Team Task Distribution (BaaS Architecture)

This document defines the roles and responsibilities for a 4-person hackathon team building on top of Supabase and React. Since there is no traditional backend server, the workload shifts heavily toward database architecture and frontend integration.

## Team Composition
1. **Member 1 (M1): Supabase & Database Architect** (Focus: DB Schema, RLS, RPC Functions)
2. **Member 2 (M2): Frontend Data Engineer** (Focus: React Query hooks, Supabase JS Integration)
3. **Member 3 (M3): Frontend UI Lead** (Focus: Layout, Component System, Routing, Auth State)
4. **Member 4 (M4): Frontend Forms & Workflows** (Focus: Complex forms, Zod Validation, Modals)

---

## Member 1: Supabase & Database Architect
**Responsibilities**: Database schema, Row Level Security (RLS) policies, Postgres RPC functions, Seeding.
**Estimated Hours**: 24h (Coding/SQL) + 8h (Testing/Optimization) + 16h (Assisting M2, Pitch Prep)

| Deliverables | Parallel Tasks (Unblocks) | Dependencies | Definition of Done |
|--------------|---------------------------|--------------|--------------------|
| Create Tables & Relations in Supabase | Unblocks M2 | None | SQL script runs successfully, tables visible in Supabase UI |
| User Sync Trigger (Auth -> Public Users) | Unblocks M3 | DB Schema | Signing up creates a user row with 'employee' role automatically |
| RLS Policies for all tables | Secures API | DB Schema | Employees cannot write to restricted tables via API |
| RPC Function: `allocate_asset` | Unblocks M4 | DB Schema | Atomic check-and-insert prevents double allocation |
| RPC Function: `book_resource` | Unblocks M4 | DB Schema | `tstzrange` EXCLUDE constraint works, overlapping fails |
| RPC Function: `get_dashboard_kpis` | Unblocks M2 | DB Schema | Returns aggregated KPI JSON |
| DB Seeding Script (SQL) | Unblocks entire team demo | All schemas | 1 SQL command populates realistic demo data |

**Daily Checklist**:
- [ ] Did I test my RLS policies by simulating an 'employee' JWT in the SQL editor?
- [ ] Are my RPC functions returning clear error messages if constraints fail?

---

## Member 2: Frontend Data Engineer
**Responsibilities**: Writing reusable React Query hooks wrapping the Supabase JS client. Acting as the bridge between M1's database and M3/M4's UI.
**Estimated Hours**: 36h (Coding) + 4h (Testing) + 8h (Rest/Pitch prep)

| Deliverables | Parallel Tasks (Unblocks) | Dependencies | Definition of Done |
|--------------|---------------------------|--------------|--------------------|
| Supabase Client Init & Env Setup | Unblocks M3, M4 | None | `supabase` instance exported globally |
| CRUD Hooks: Depts, Categories, Employees| Unblocks M4 (Forms) | M1 (Schema) | `useQuery` and `useMutation` hooks available |
| Asset Query Hooks (with pagination) | Unblocks M3 (Tables) | M1 (Schema) | Hook returns data and total count for tables |
| RPC Hooks (Allocation, Booking) | Unblocks M4 | M1 (RPCs) | Hooks correctly call `supabase.rpc()` and parse errors |
| Supabase Storage Upload Utility | Unblocks M4 (Asset Form)| Supabase Bucket | Function accepts file, uploads, and returns public URL |

**Daily Checklist**:
- [ ] Are my mutations calling `queryClient.invalidateQueries()` on success to update the UI?
- [ ] Am I parsing Supabase error codes (e.g. 42501 for RLS) into human-readable strings?

---

## Member 3: Frontend UI Lead
**Responsibilities**: Project setup, Routing, Base Layout, Components, Dashboard, Auth UI.
**Estimated Hours**: 36h (Coding) + 4h (UI Polish) + 8h (Rest/Pitch prep)

| Deliverables | Parallel Tasks (Unblocks) | Dependencies | Definition of Done |
|--------------|---------------------------|--------------|--------------------|
| React/Vite Init + Tailwind Config | Unblocks M4 | None | App runs, Tailwind classes apply |
| Base UI Components (Button, Modal, Input)| Unblocks M4 | None | Reusable components exist in `/ui` folder |
| Routing & ProtectedRoute component | Unblocks M4 (Pages) | None | Navigation works, unauthenticated users redirected to /login |
| Auth Flow UI + Zustand Store | Unblocks M2 | None | `supabase.auth.onAuthStateChange` syncs user/role to Zustand |
| Dashboard Layout & KPI Cards | - | M2 (KPI Hook) | Real data renders in KPI cards |
| Booking Calendar UI | - | M2 (Booking Hook) | Events render on calendar, click opens booking modal |
| GitHub Actions Deployment Setup | - | GitHub Repo | Push to main deploys to GitHub Pages |

**Daily Checklist**:
- [ ] Is the sidebar responsive (collapses on mobile)?
- [ ] Did I use CSS variables for colors to maintain consistency?

---

## Member 4: Frontend Forms & Workflows
**Responsibilities**: Connecting M2's hooks to complex UIs, Form Validation, Data Tables.
**Estimated Hours**: 36h (Coding) + 4h (Testing) + 8h (Rest/Pitch prep)

| Deliverables | Parallel Tasks (Unblocks) | Dependencies | Definition of Done |
|--------------|---------------------------|--------------|--------------------|
| Admin Setup Forms (Depts, Categories) | - | M2 (Hooks), M3 (UI) | Form submits successfully, table updates |
| Asset Registration Form | - | M2 (Hooks), M3 (UI) | Validates with Zod, uploads image, saves to Supabase |
| Asset Directory (Table + Filters) | - | M2 (Hooks) | Data displays, pagination/search works |
| Allocation & Transfer UI | - | M2 (Alloc Hook) | Handles RPC Conflict errors gracefully (shows Transfer button) |
| Maintenance & Audit UI | - | M2 (Hooks) | Can progress a ticket through the workflow |

**Daily Checklist**:
- [ ] Am I using React Hook Form to prevent re-renders on large forms?
- [ ] Are required fields clearly marked and validated before submitting to Supabase?

---

## 4. Conflict Resolution & Dependency Management

**Rule of Thumb for Blockers**:
If Frontend (M3/M4) is blocked waiting for Database (M1) or Data Hooks (M2):
1. Define the exact JSON shape expected by the UI.
2. M2 creates a mocked React Query hook returning that hardcoded JSON.
3. M3/M4 build the UI against the mock.
4. When M1 finishes the SQL, M2 updates the hook to call Supabase instead of returning the mock.

**Git Merge Strategy**:
- Since there is no backend codebase, everyone works in the same frontend repository.
- Use feature branches (e.g., `feat/asset-table`).
- Merge to `main` ONLY when a feature works end-to-end. Do not merge broken code to `main`.
