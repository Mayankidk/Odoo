create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() and status = 'active'
$$;

create or replace function public.current_user_department_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select department_id from public.users where id = auth.uid() and status = 'active'
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'admin'
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
as $$
  select public.current_user_role() in ('admin', 'asset_manager')
$$;

create or replace function public.is_department_head()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'department_head'
$$;

alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.asset_categories enable row level security;
alter table public.assets enable row level security;
alter table public.asset_documents enable row level security;
alter table public.allocations enable row level security;
alter table public.transfer_requests enable row level security;
alter table public.bookings enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.audit_cycles enable row level security;
alter table public.audit_cycle_auditors enable row level security;
alter table public.audit_items enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- users
drop policy if exists "Users can view active directory" on public.users;
drop policy if exists "Users can update own profile basics" on public.users;
drop policy if exists "Admins can manage users" on public.users;
create policy "Users can view active directory" on public.users
  for select to authenticated using (status = 'active' or public.is_admin());
create policy "Users can update own profile basics" on public.users
  for update to authenticated using (id = auth.uid()) with check (
    id = auth.uid()
    and role = (select role from public.users where id = auth.uid())
    and status = (select status from public.users where id = auth.uid())
  );
create policy "Admins can manage users" on public.users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- departments
drop policy if exists "Authenticated users can view departments" on public.departments;
drop policy if exists "Admins can manage departments" on public.departments;
create policy "Authenticated users can view departments" on public.departments
  for select to authenticated using (true);
create policy "Admins can manage departments" on public.departments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- asset_categories
drop policy if exists "Authenticated users can view categories" on public.asset_categories;
drop policy if exists "Admins can manage categories" on public.asset_categories;
create policy "Authenticated users can view categories" on public.asset_categories
  for select to authenticated using (true);
create policy "Admins can manage categories" on public.asset_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- assets
drop policy if exists "Authenticated users can view assets" on public.assets;
drop policy if exists "Managers can insert assets" on public.assets;
drop policy if exists "Managers can update assets" on public.assets;
drop policy if exists "Admins can delete assets" on public.assets;
create policy "Authenticated users can view assets" on public.assets
  for select to authenticated using (true);
create policy "Managers can insert assets" on public.assets
  for insert to authenticated with check (public.is_manager());
create policy "Managers can update assets" on public.assets
  for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "Admins can delete assets" on public.assets
  for delete to authenticated using (public.is_admin());

-- asset_documents
drop policy if exists "Authenticated users can view asset documents" on public.asset_documents;
drop policy if exists "Managers can manage asset documents" on public.asset_documents;
create policy "Authenticated users can view asset documents" on public.asset_documents
  for select to authenticated using (true);
create policy "Managers can manage asset documents" on public.asset_documents
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- allocations
drop policy if exists "Users can view relevant allocations" on public.allocations;
drop policy if exists "Managers can manage allocations" on public.allocations;
create policy "Users can view relevant allocations" on public.allocations
  for select to authenticated using (
    public.is_manager()
    or allocated_to_user_id = auth.uid()
    or (
      public.is_department_head()
      and allocated_to_dept_id = public.current_user_department_id()
    )
  );
create policy "Managers can manage allocations" on public.allocations
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- transfer_requests
drop policy if exists "Users can view relevant transfer requests" on public.transfer_requests;
drop policy if exists "Employees can request transfers" on public.transfer_requests;
drop policy if exists "Managers and department heads can update transfers" on public.transfer_requests;
create policy "Users can view relevant transfer requests" on public.transfer_requests
  for select to authenticated using (
    public.is_manager()
    or requested_by_id = auth.uid()
    or exists (
      select 1
      from public.allocations a
      where a.id = transfer_requests.allocation_id
        and (
          a.allocated_to_user_id = auth.uid()
          or (public.is_department_head() and a.allocated_to_dept_id = public.current_user_department_id())
        )
    )
  );
create policy "Employees can request transfers" on public.transfer_requests
  for insert to authenticated with check (requested_by_id = auth.uid());
create policy "Managers and department heads can update transfers" on public.transfer_requests
  for update to authenticated using (public.is_manager() or public.is_department_head())
  with check (public.is_manager() or public.is_department_head());

-- bookings
drop policy if exists "Users can view relevant bookings" on public.bookings;
drop policy if exists "Authenticated users can book resources" on public.bookings;
drop policy if exists "Users can update own bookings" on public.bookings;
create policy "Users can view relevant bookings" on public.bookings
  for select to authenticated using (public.is_manager() or booked_by_id = auth.uid());
create policy "Authenticated users can book resources" on public.bookings
  for insert to authenticated with check (booked_by_id = auth.uid());
create policy "Users can update own bookings" on public.bookings
  for update to authenticated using (booked_by_id = auth.uid() or public.is_manager())
  with check (booked_by_id = auth.uid() or public.is_manager());

-- maintenance_requests
drop policy if exists "Users can view relevant maintenance requests" on public.maintenance_requests;
drop policy if exists "Authenticated users can raise maintenance" on public.maintenance_requests;
drop policy if exists "Managers and technicians can update maintenance" on public.maintenance_requests;
create policy "Users can view relevant maintenance requests" on public.maintenance_requests
  for select to authenticated using (
    public.is_manager()
    or raised_by_id = auth.uid()
    or assigned_technician_id = auth.uid()
  );
create policy "Authenticated users can raise maintenance" on public.maintenance_requests
  for insert to authenticated with check (raised_by_id = auth.uid());
create policy "Managers and technicians can update maintenance" on public.maintenance_requests
  for update to authenticated using (
    public.is_manager() or assigned_technician_id = auth.uid()
  )
  with check (public.is_manager() or assigned_technician_id = auth.uid());

-- audit_cycles
drop policy if exists "Managers can view audit cycles" on public.audit_cycles;
drop policy if exists "Managers can manage audit cycles" on public.audit_cycles;
create policy "Managers can view audit cycles" on public.audit_cycles
  for select to authenticated using (
    public.is_manager()
    or exists (
      select 1 from public.audit_cycle_auditors aca
      where aca.audit_cycle_id = audit_cycles.id and aca.auditor_id = auth.uid()
    )
  );
create policy "Managers can manage audit cycles" on public.audit_cycles
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- audit_cycle_auditors
drop policy if exists "Managers and assigned auditors can view audit assignments" on public.audit_cycle_auditors;
drop policy if exists "Managers can manage audit assignments" on public.audit_cycle_auditors;
create policy "Managers and assigned auditors can view audit assignments" on public.audit_cycle_auditors
  for select to authenticated using (public.is_manager() or auditor_id = auth.uid());
create policy "Managers can manage audit assignments" on public.audit_cycle_auditors
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- audit_items
drop policy if exists "Managers and assigned auditors can view audit items" on public.audit_items;
drop policy if exists "Managers can create audit items" on public.audit_items;
drop policy if exists "Assigned auditors can update audit items" on public.audit_items;
create policy "Managers and assigned auditors can view audit items" on public.audit_items
  for select to authenticated using (
    public.is_manager()
    or exists (
      select 1 from public.audit_cycle_auditors aca
      where aca.audit_cycle_id = audit_items.audit_cycle_id and aca.auditor_id = auth.uid()
    )
  );
create policy "Managers can create audit items" on public.audit_items
  for insert to authenticated with check (public.is_manager());
create policy "Assigned auditors can update audit items" on public.audit_items
  for update to authenticated using (
    public.is_manager()
    or exists (
      select 1 from public.audit_cycle_auditors aca
      join public.audit_cycles ac on ac.id = aca.audit_cycle_id
      where aca.audit_cycle_id = audit_items.audit_cycle_id
        and aca.auditor_id = auth.uid()
        and ac.status <> 'completed'
    )
  )
  with check (
    public.is_manager()
    or exists (
      select 1 from public.audit_cycle_auditors aca
      join public.audit_cycles ac on ac.id = aca.audit_cycle_id
      where aca.audit_cycle_id = audit_items.audit_cycle_id
        and aca.auditor_id = auth.uid()
        and ac.status <> 'completed'
    )
  );

-- notifications
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can mark own notifications read" on public.notifications;
drop policy if exists "Managers can create notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "Users can mark own notifications read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Managers can create notifications" on public.notifications
  for insert to authenticated with check (public.is_manager());

-- audit_logs
drop policy if exists "Managers can view audit logs" on public.audit_logs;
drop policy if exists "Managers can create audit logs" on public.audit_logs;
create policy "Managers can view audit logs" on public.audit_logs
  for select to authenticated using (public.is_manager());
create policy "Managers can create audit logs" on public.audit_logs
  for insert to authenticated with check (public.is_manager() or user_id = auth.uid());

create or replace function public.allocate_asset(
  p_asset_id uuid,
  p_user_id uuid default null,
  p_department_id uuid default null,
  p_expected_return_date date default null
)
returns public.allocations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asset public.assets;
  v_holder text;
  v_allocation public.allocations;
begin
  if not public.is_manager() then
    raise exception 'FORBIDDEN: Only admins and asset managers can allocate assets';
  end if;

  if num_nonnulls(p_user_id, p_department_id) <> 1 then
    raise exception 'INVALID_HOLDER: Provide exactly one user or department holder';
  end if;

  select * into v_asset
  from public.assets
  where id = p_asset_id
  for update;

  if not found then
    raise exception 'ASSET_NOT_FOUND: Asset does not exist';
  end if;

  if v_asset.status <> 'available' then
    select coalesce(u.name, d.name, 'unknown holder')
    into v_holder
    from public.allocations a
    left join public.users u on u.id = a.allocated_to_user_id
    left join public.departments d on d.id = a.allocated_to_dept_id
    where a.asset_id = p_asset_id and a.status = 'active'
    limit 1;

    raise exception 'ASSET_ALREADY_ALLOCATED: Currently held by %', coalesce(v_holder, v_asset.status::text);
  end if;

  if p_department_id is not null and exists (
    select 1 from public.departments where id = p_department_id and status = 'inactive'
  ) then
    raise exception 'INACTIVE_DEPARTMENT: Deactivated departments cannot receive allocations';
  end if;

  insert into public.allocations (
    asset_id,
    allocated_to_user_id,
    allocated_to_dept_id,
    allocated_by_id,
    expected_return_date
  )
  values (p_asset_id, p_user_id, p_department_id, auth.uid(), p_expected_return_date)
  returning * into v_allocation;

  update public.assets
  set status = 'allocated'
  where id = p_asset_id;

  insert into public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  values (auth.uid(), 'ALLOCATE', 'allocation', v_allocation.id, to_jsonb(v_allocation));

  return v_allocation;
exception
  when unique_violation then
    raise exception 'ASSET_ALREADY_ALLOCATED: Asset already has an active allocation';
end;
$$;

create or replace function public.book_resource(
  p_resource_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_purpose varchar default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resource public.assets;
  v_booking public.bookings;
begin
  if p_end_time <= p_start_time then
    raise exception 'INVALID_BOOKING_TIME: End time must be after start time';
  end if;

  select * into v_resource
  from public.assets
  where id = p_resource_id
  for update;

  if not found then
    raise exception 'RESOURCE_NOT_FOUND: Resource does not exist';
  end if;

  if v_resource.is_bookable is not true then
    raise exception 'RESOURCE_NOT_BOOKABLE: Asset is not marked as a shared resource';
  end if;

  if v_resource.status in ('under_maintenance', 'lost', 'retired', 'disposed') then
    raise exception 'RESOURCE_UNAVAILABLE: Resource status is %', v_resource.status;
  end if;

  insert into public.bookings (resource_id, booked_by_id, start_time, end_time, purpose)
  values (p_resource_id, auth.uid(), p_start_time, p_end_time, p_purpose)
  returning * into v_booking;

  insert into public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  values (auth.uid(), 'BOOK', 'booking', v_booking.id, to_jsonb(v_booking));

  return v_booking;
exception
  when exclusion_violation then
    raise exception 'BOOKING_OVERLAP: Booking overlaps with an existing reservation';
end;
$$;

create or replace function public.get_dashboard_kpis()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := public.current_user_role();
  v_department_id uuid := public.current_user_department_id();
  v_result jsonb;
begin
  select jsonb_build_object(
    'assets_available', (
      select count(*) from public.assets a
      where a.status = 'available'
        and (v_role in ('admin', 'asset_manager') or a.department_id = v_department_id)
    ),
    'assets_allocated', (
      select count(*) from public.assets a
      where a.status = 'allocated'
        and (v_role in ('admin', 'asset_manager') or a.department_id = v_department_id)
    ),
    'maintenance_today', (
      select count(*) from public.maintenance_requests mr
      join public.assets a on a.id = mr.asset_id
      where mr.created_at::date = current_date
        and (v_role in ('admin', 'asset_manager') or mr.raised_by_id = auth.uid() or a.department_id = v_department_id)
    ),
    'active_bookings', (
      select count(*) from public.bookings b
      join public.assets a on a.id = b.resource_id
      where b.status in ('upcoming', 'ongoing')
        and b.end_time >= now()
        and (v_role in ('admin', 'asset_manager') or b.booked_by_id = auth.uid() or a.department_id = v_department_id)
    ),
    'pending_transfers', (
      select count(*) from public.transfer_requests tr
      join public.allocations al on al.id = tr.allocation_id
      where tr.status = 'pending'
        and (v_role in ('admin', 'asset_manager') or tr.requested_by_id = auth.uid() or al.allocated_to_dept_id = v_department_id)
    ),
    'upcoming_returns', (
      select count(*) from public.allocations al
      where al.status = 'active'
        and al.expected_return_date between current_date and (current_date + 7)
        and (v_role in ('admin', 'asset_manager') or al.allocated_to_user_id = auth.uid() or al.allocated_to_dept_id = v_department_id)
    ),
    'overdue_returns', (
      select count(*) from public.allocations al
      where al.status = 'active'
        and al.expected_return_date < current_date
        and (v_role in ('admin', 'asset_manager') or al.allocated_to_user_id = auth.uid() or al.allocated_to_dept_id = v_department_id)
    )
  )
  into v_result;

  return v_result;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'asset-documents',
  'asset-documents',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects policies (drop first to allow re-runs)
drop policy if exists "Authenticated users can view asset documents bucket" on storage.objects;
drop policy if exists "Managers can upload asset documents" on storage.objects;
drop policy if exists "Managers can update asset documents" on storage.objects;
drop policy if exists "Managers can delete asset documents" on storage.objects;
-- also drop the fixed policy names in case migration 004 already ran
drop policy if exists "Authenticated users can upload asset documents" on storage.objects;
drop policy if exists "Authenticated users can update asset documents" on storage.objects;

create policy "Authenticated users can view asset documents bucket" on storage.objects
  for select to authenticated using (bucket_id = 'asset-documents');
-- All authenticated users can upload (employees, dept heads, managers)
create policy "Authenticated users can upload asset documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'asset-documents');
-- All authenticated users can update/replace files
create policy "Authenticated users can update asset documents" on storage.objects
  for update to authenticated
  using (bucket_id = 'asset-documents')
  with check (bucket_id = 'asset-documents');
-- Only managers can delete files
create policy "Managers can delete asset documents" on storage.objects
  for delete to authenticated using (bucket_id = 'asset-documents' and public.is_manager());

