# AssetFlow — Project Timeline & Tasks (48-Hour Hackathon - BaaS)

This timeline assumes a standard 48-hour hackathon format for a team of 4 using a Backend-as-a-Service (Supabase) architecture.

## 1. High-Level Timeline

| Milestone | Timeframe | Goal |
|-----------|-----------|------|
| **M1: Foundation** | Hours 0–6 | DB schema defined in Supabase, RLS policies written, GitHub repo & React skeleton created. |
| **M2: Auth & Frontend Scaffolding** | Hours 6–14 | Users can sign in (Supabase Auth). React Router and basic layout in place. |
| **M3: Core CRUD via SDK** | Hours 14–22 | React Query hooks built to fetch and mutate Assets, Departments, and Categories directly from Supabase. |
| **M4: Complex Workflows** | Hours 22–34 | Allocation (using RPC for conflict blocking), Booking (RPC for overlap blocking), Maintenance flow working E2E. |
| **M5: Audits & Storage** | Hours 34–40 | Audit cycles working. Image uploading to Supabase Storage implemented. |
| **M6: Polish & Bug Bash** | Hours 40–44 | UI polish, fixing edge cases, RLS policy auditing, ensuring demo flow is flawless. |
| **M7: Pitch & Demo Prep** | Hours 44–48 | Seed realistic demo data. Record backup video. Finalize pitch deck. |

---

## 2. Detailed Task Breakdown (Markdown TODO)

### Phase 1: Setup & Infrastructure
- [ ] Initialize GitHub repo and branch protection rules.
- [ ] Create Supabase Project.
- [ ] Initialize React frontend (`npm create vite@latest`).
- [ ] Install Tailwind CSS, shadcn/ui, React Router, Zustand, React Query, and `@supabase/supabase-js`.
- [ ] Setup GitHub Actions deployment workflow for GitHub Pages.
- [ ] Add Supabase URL and Anon Key to `.env` and GitHub Secrets.

### Phase 2: Database & Security (Supabase)
- [ ] Run SQL to create tables: `users`, `departments`, `categories`, `assets`, `allocations`, `bookings`, `maintenance_requests`, `audits`.
- [ ] Create Database Trigger on `auth.users` insert to auto-create a record in public `users` table with default `employee` role.
- [ ] Write RLS Policies for `departments` and `categories` (Admin full access, Public read).
- [ ] Write RLS Policies for `assets` (Manager full access, Public read).
- [ ] Write RLS Policies for `allocations` (Manager insert, Owner read).
- [ ] Write Postgres RPC function for `allocate_asset` (to check for existing active allocations atomically).
- [ ] Write Postgres RPC function for `book_resource` (using `tstzrange` EXCLUDE constraint check).
- [ ] Setup Supabase Storage bucket for `asset-documents` with public read, authenticated insert RLS policies.

### Phase 3: Frontend Core (UI)
- [ ] Setup global CSS variables and theme configuration.
- [ ] Build base layout (Sidebar, Header with User Menu).
- [ ] Build Auth Pages (Login, Signup) using Supabase Auth UI or custom forms.
- [ ] Setup Zustand Auth Store listening to `supabase.auth.onAuthStateChange`.
- [ ] Build Dashboard layout.

### Phase 4: Frontend Data Integration (React Query + Supabase JS)
- [ ] Build Admin Setup forms + React Query mutations (Departments, Categories).
- [ ] Build Asset Directory data table with filters.
- [ ] Build Asset Form (Registration) with Supabase Storage image upload.
- [ ] Build Allocation Modal (Calling the `allocate_asset` RPC function).
- [ ] Build Resource Booking Calendar interface (Calling the `book_resource` RPC function).
- [ ] Build Maintenance Request Form and Approval queue.
- [ ] Build Audit Cycle management view.

### Phase 5: Integration & Polish
- [ ] Connect Dashboard KPIs to real data (RPC aggregation function).
- [ ] Implement Toast notifications for Supabase error codes (e.g. 42501 RLS errors).
- [ ] Ensure Role-Based UI (hide Admin tabs for Employees) based on JWT claims in Zustand.
- [ ] Test Edge Case: Attempt double allocation via UI.
- [ ] Test Edge Case: Attempt overlapping booking via UI.
- [ ] Audit responsive design on mobile/tablet widths.

### Phase 6: Demo Prep
- [ ] Run SQL seed script on Supabase to populate realistic data (5 depts, 50 assets, 10 users).
- [ ] Create explicit login credentials for Judges (Admin, Manager, Employee).
- [ ] Write README.md with setup instructions and architecture overview.
- [ ] Record 3-minute demo video.
- [ ] Finalize pitch deck.
