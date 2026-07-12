# M2 - Frontend Data Engineer

## Mission

Own the data access layer between Supabase and the React UI. UI developers should consume hooks and utilities, not call Supabase directly.

## Primary Responsibilities

- Initialize and export the Supabase client.
- Document required environment variables in `.env.example`.
- Build React Query hooks for departments, categories, employees, assets, allocations, bookings, maintenance requests, audits, and dashboard KPIs.
- Build mutations for admin setup, asset registration, allocation, booking, maintenance status changes, and audits.
- Build Supabase Storage upload utility.
- Convert Supabase/RLS/RPC errors into readable messages for UI toasts.

## Interfaces To Share

- Hook names, parameters, return values, loading states, and error behavior for M3 and M4.
- Mock hook responses when M1 database work is still in progress.
- Query invalidation rules after each mutation.

## Done Criteria

- M3 and M4 can build screens without importing `supabase` directly.
- Hooks invalidate stale queries after successful mutations.
- RPC conflicts and RLS failures surface as user-readable errors.
- Hooks work with either mock data or the real Supabase schema during integration.
