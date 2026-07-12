create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";
create extension if not exists "pg_trgm";

create type public.user_role as enum ('admin', 'asset_manager', 'department_head', 'employee');
create type public.record_status as enum ('active', 'inactive');
create type public.asset_condition as enum ('new', 'good', 'fair', 'poor', 'damaged');
create type public.asset_status as enum ('available', 'allocated', 'reserved', 'under_maintenance', 'lost', 'retired', 'disposed');
create type public.allocation_status as enum ('active', 'returned', 'transferred', 'overdue');
create type public.transfer_status as enum ('pending', 'approved', 'rejected');
create type public.booking_status as enum ('upcoming', 'ongoing', 'completed', 'cancelled');
create type public.maintenance_priority as enum ('low', 'medium', 'high', 'critical');
create type public.maintenance_status as enum ('pending', 'approved', 'rejected', 'assigned', 'in_progress', 'resolved');
create type public.audit_scope_type as enum ('department', 'location');
create type public.audit_cycle_status as enum ('planned', 'in_progress', 'completed');
create type public.audit_verification_status as enum ('pending', 'verified', 'missing', 'damaged');

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  parent_department_id uuid references public.departments(id) on delete restrict,
  department_head_id uuid,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(100) not null,
  email varchar(255) not null unique,
  role public.user_role not null default 'employee',
  department_id uuid references public.departments(id) on delete set null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.departments
  add constraint departments_department_head_id_fkey
  foreign key (department_head_id) references public.users(id) on delete set null;

create table public.asset_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  description text,
  custom_fields_schema jsonb not null default '{}'::jsonb,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_tag varchar(20) not null unique,
  name varchar(200) not null,
  category_id uuid not null references public.asset_categories(id) on delete restrict,
  serial_number varchar(100),
  acquisition_date date,
  acquisition_cost numeric(12, 2),
  condition public.asset_condition not null default 'new',
  location varchar(200),
  status public.asset_status not null default 'available',
  is_bookable boolean not null default false,
  registered_by uuid not null references public.users(id) on delete restrict,
  department_id uuid references public.departments(id) on delete set null,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_asset_tag_format check (asset_tag ~ '^AF-[0-9]{4,}$'),
  constraint assets_acquisition_cost_positive check (acquisition_cost is null or acquisition_cost >= 0)
);

create table public.asset_documents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  file_name varchar(255) not null,
  file_url varchar(500) not null,
  file_type varchar(100) not null,
  file_size integer not null,
  created_at timestamptz not null default now(),
  constraint asset_documents_file_size_positive check (file_size > 0)
);

create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete restrict,
  allocated_to_user_id uuid references public.users(id) on delete restrict,
  allocated_to_dept_id uuid references public.departments(id) on delete restrict,
  allocated_by_id uuid not null references public.users(id) on delete restrict,
  expected_return_date date,
  actual_return_date date,
  return_notes text,
  condition_on_return public.asset_condition,
  status public.allocation_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint allocations_single_holder check (
    num_nonnulls(allocated_to_user_id, allocated_to_dept_id) = 1
  )
);

create table public.transfer_requests (
  id uuid primary key default gen_random_uuid(),
  allocation_id uuid not null references public.allocations(id) on delete restrict,
  requested_by_id uuid not null references public.users(id) on delete restrict,
  approved_by_id uuid references public.users(id) on delete restrict,
  status public.transfer_status not null default 'pending',
  reason text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.assets(id) on delete restrict,
  booked_by_id uuid not null references public.users(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  purpose varchar(500),
  status public.booking_status not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_valid_time_range check (end_time > start_time)
);

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete restrict,
  raised_by_id uuid not null references public.users(id) on delete restrict,
  approved_by_id uuid references public.users(id) on delete restrict,
  assigned_technician_id uuid references public.users(id) on delete restrict,
  description text not null,
  priority public.maintenance_priority not null default 'medium',
  status public.maintenance_status not null default 'pending',
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_cycles (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  scope_type public.audit_scope_type not null,
  scope_id uuid references public.departments(id) on delete restrict,
  scope_location varchar(200),
  start_date date not null,
  end_date date not null,
  status public.audit_cycle_status not null default 'planned',
  created_by_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audit_cycles_valid_dates check (end_date >= start_date),
  constraint audit_cycles_valid_scope check (
    (scope_type = 'department' and scope_id is not null and scope_location is null)
    or (scope_type = 'location' and scope_id is null and scope_location is not null)
  )
);

create table public.audit_cycle_auditors (
  id uuid primary key default gen_random_uuid(),
  audit_cycle_id uuid not null references public.audit_cycles(id) on delete cascade,
  auditor_id uuid not null references public.users(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unique (audit_cycle_id, auditor_id)
);

create table public.audit_items (
  id uuid primary key default gen_random_uuid(),
  audit_cycle_id uuid not null references public.audit_cycles(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  verified_by_id uuid references public.users(id) on delete restrict,
  verification_status public.audit_verification_status not null default 'pending',
  notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (audit_cycle_id, asset_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type varchar(50) not null,
  title varchar(200) not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action varchar(50) not null,
  resource_type varchar(50) not null,
  resource_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  ip_address varchar(45),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_departments_updated_at before update on public.departments
  for each row execute function public.set_updated_at();
create trigger set_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger set_asset_categories_updated_at before update on public.asset_categories
  for each row execute function public.set_updated_at();
create trigger set_assets_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
create trigger set_allocations_updated_at before update on public.allocations
  for each row execute function public.set_updated_at();
create trigger set_transfer_requests_updated_at before update on public.transfer_requests
  for each row execute function public.set_updated_at();
create trigger set_bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger set_maintenance_requests_updated_at before update on public.maintenance_requests
  for each row execute function public.set_updated_at();
create trigger set_audit_cycles_updated_at before update on public.audit_cycles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    new.email,
    'employee'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create sequence public.asset_tag_sequence start 1;

create or replace function public.set_asset_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.asset_tag is null or new.asset_tag = '' then
    new.asset_tag := 'AF-' || lpad(nextval('public.asset_tag_sequence')::text, 4, '0');
  end if;

  if new.registered_by is null then
    new.registered_by := auth.uid();
  end if;

  return new;
end;
$$;

create trigger set_asset_defaults_before_insert
  before insert on public.assets
  for each row execute function public.set_asset_defaults();

create or replace function public.prevent_asset_tag_update()
returns trigger
language plpgsql
as $$
begin
  if new.asset_tag <> old.asset_tag then
    raise exception 'ASSET_TAG_IMMUTABLE: Asset tags cannot be changed after creation';
  end if;
  return new;
end;
$$;

create trigger prevent_asset_tag_update_before_update
  before update on public.assets
  for each row execute function public.prevent_asset_tag_update();

create unique index allocations_one_active_per_asset_idx
  on public.allocations (asset_id)
  where status = 'active';

alter table public.bookings
  add constraint no_overlapping_bookings
  exclude using gist (
    resource_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
  where (status <> 'cancelled');

create index users_department_id_idx on public.users (department_id);
create index users_role_status_idx on public.users (role, status);
create index assets_category_id_idx on public.assets (category_id);
create index assets_status_idx on public.assets (status);
create index assets_department_id_idx on public.assets (department_id);
create index assets_bookable_idx on public.assets (is_bookable) where is_bookable = true;
create index assets_serial_number_idx on public.assets (serial_number);
create index assets_name_trgm_idx on public.assets using gin (name gin_trgm_ops);
create index allocations_holder_user_idx on public.allocations (allocated_to_user_id);
create index allocations_expected_return_open_idx on public.allocations (expected_return_date)
  where actual_return_date is null;
create index bookings_booked_by_idx on public.bookings (booked_by_id);
create index bookings_status_idx on public.bookings (status);
create index maintenance_requests_asset_id_idx on public.maintenance_requests (asset_id);
create index maintenance_requests_status_idx on public.maintenance_requests (status);
create index maintenance_requests_raised_by_idx on public.maintenance_requests (raised_by_id);
create index audit_items_cycle_idx on public.audit_items (audit_cycle_id);
create index audit_items_asset_idx on public.audit_items (asset_id);
create index notifications_user_unread_idx on public.notifications (user_id, is_read);
create index notifications_created_at_idx on public.notifications (created_at desc);
create index audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);
create index audit_logs_user_idx on public.audit_logs (user_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
