# M1 - Supabase & Database Architect

## Mission

Own the database-as-backend layer for AssetFlow: schema, RLS, RPC functions, storage policies, and demo seed data.

## Primary Responsibilities

- Create migrations for `users`, `departments`, `categories`, `assets`, `allocations`, `bookings`, `maintenance_requests`, and `audits`.
- Add auth trigger that creates a public `users` record with default `employee` role.
- Implement RLS policies for all core tables.
- Implement `allocate_asset`, `book_resource`, and `get_dashboard_kpis` RPC functions.
- Configure Supabase Storage bucket and policies for asset documents.
- Create realistic seed SQL for demo data.

## Interfaces To Share

- Table names, column names, and enums for M2.
- RPC argument and response shapes for M2 and M4.
- Role rules for M3's role-based UI.
- Demo user credentials for final README and pitch.

## Done Criteria

- SQL migrations can be run from a clean Supabase project.
- RLS is tested for Admin, Manager, Department Head, and Employee behavior.
- Double allocation and overlapping booking fail at the database layer.
- Seed script creates enough data for dashboard, directory, booking, maintenance, and audit demos.
