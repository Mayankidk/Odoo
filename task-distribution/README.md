# AssetFlow Task Distribution

This folder contains the hackathon work split for the AssetFlow project. It is intentionally stored outside `.agents` so it can be committed and shared through GitHub.

## Team Split

| Member | Role | File |
|---|---|---|
| M1 | Supabase & Database Architect | `member-1-supabase-database.md` |
| M2 | Frontend Data Engineer | `member-2-frontend-data.md` |
| M3 | Frontend UI Lead | `member-3-frontend-ui.md` |
| M4 | Frontend Forms & Workflows | `member-4-forms-workflows.md` |

## Execution Rules

- M3 starts the React shell immediately so M2 and M4 have a place to integrate.
- M1 and M2 agree on table names, RPC names, and returned JSON shapes before M4 wires forms.
- If database work is blocked, M2 creates mocked React Query hooks with the final expected shape.
- M4 builds against hooks, not direct Supabase calls.
- All schema, RLS, and RPC changes should live in `supabase/migrations`.
- Merge only after the feature builds and demo-critical flows are checked.

## First 6 Hours

| Hour | M1 | M2 | M3 | M4 |
|---|---|---|---|---|
| 0-1 | Create Supabase project | Define env contract | Initialize Vite app | Review UX flows and forms |
| 1-2 | Start schema migration | Add Supabase client stub | Install and configure dependencies | Draft Zod schemas from SRS |
| 2-4 | Finish core tables | Create mock query hooks | Build layout and routing | Build form skeletons |
| 4-6 | Add auth trigger and first RLS policies | Add auth/data hook contracts | Build auth pages and store | Build admin setup UI skeleton |
