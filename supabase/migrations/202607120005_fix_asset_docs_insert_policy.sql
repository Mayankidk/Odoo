-- Fix: allow any authenticated user to upload documents (not just managers)
-- Previously only is_manager() could insert into asset_documents, blocking employees.
drop policy if exists "Managers can manage asset documents" on public.asset_documents;
drop policy if exists "Authenticated users can insert asset documents" on public.asset_documents;
drop policy if exists "Managers can update or delete asset documents" on public.asset_documents;

-- All authenticated users can upload documents
create policy "Authenticated users can insert asset documents" on public.asset_documents
  for insert to authenticated with check (true);

-- Only managers can update/delete asset documents
create policy "Managers can update or delete asset documents" on public.asset_documents
  for all to authenticated
  using (public.is_manager())
  with check (public.is_manager());
