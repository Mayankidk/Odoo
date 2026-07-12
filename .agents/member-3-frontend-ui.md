# M3 - Frontend UI Lead

## Mission

Own the React application shell, routing, auth experience, shared components, dashboard, and visual consistency.

## Source Docs

- `docs/architecture/07_Frontend_Architecture.md`
- `docs/architecture/08_Tech_Stack.md`
- `docs/design/11_UI_UX_Guidelines.md`
- `docs/design/03_UX_and_Use_Cases.md`
- `docs/project_management/14_Workflow_and_Standards.md`

## Deliverables

- Initialize Vite/React project and configure Tailwind/shadcn/ui.
- Build responsive layout with sidebar, header, user menu, and protected content area.
- Build routing and `ProtectedRoute` behavior.
- Build login and signup screens integrated with Supabase auth.
- Build Zustand auth store using `supabase.auth.onAuthStateChange`.
- Build shared UI components used by M4.
- Build dashboard layout, KPI cards, role-aware navigation, and booking calendar UI.
- Add GitHub Actions deployment workflow.

## Interfaces To Share

- Shared UI component API for M4.
- Auth store shape for M2 and M4.
- Layout slots and page conventions for all feature screens.

## Done Criteria

- App runs locally and builds successfully.
- Unauthenticated users are redirected to login.
- Role-aware navigation is wired to the auth store.
- Layout is responsive on desktop, tablet, and mobile.
- Dashboard can render real KPI data once M2 hooks are ready.
