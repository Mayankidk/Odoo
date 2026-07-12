insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@assetflow.test', crypt('AssetFlow123!', gen_salt('bf')), now(), '{"name":"Aarav Admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager@assetflow.test', crypt('AssetFlow123!', gen_salt('bf')), now(), '{"name":"Meera Asset Manager"}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'head@assetflow.test', crypt('AssetFlow123!', gen_salt('bf')), now(), '{"name":"Rohan Department Head"}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'employee@assetflow.test', crypt('AssetFlow123!', gen_salt('bf')), now(), '{"name":"Anita Employee"}', now(), now()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'auditor@assetflow.test', crypt('AssetFlow123!', gen_salt('bf')), now(), '{"name":"Kabir Auditor"}', now(), now())
on conflict (id) do nothing;

insert into public.departments (id, name, status)
values
  ('10000000-0000-0000-0000-000000000001', 'Administration', 'active'),
  ('10000000-0000-0000-0000-000000000002', 'Engineering', 'active'),
  ('10000000-0000-0000-0000-000000000003', 'Facilities', 'active')
on conflict (id) do nothing;

update public.users set role = 'admin', department_id = '10000000-0000-0000-0000-000000000001' where id = '00000000-0000-0000-0000-000000000001';
update public.users set role = 'asset_manager', department_id = '10000000-0000-0000-0000-000000000003' where id = '00000000-0000-0000-0000-000000000002';
update public.users set role = 'department_head', department_id = '10000000-0000-0000-0000-000000000002' where id = '00000000-0000-0000-0000-000000000003';
update public.users set role = 'employee', department_id = '10000000-0000-0000-0000-000000000002' where id = '00000000-0000-0000-0000-000000000004';
update public.users set role = 'employee', department_id = '10000000-0000-0000-0000-000000000003' where id = '00000000-0000-0000-0000-000000000005';

update public.departments
set department_head_id = '00000000-0000-0000-0000-000000000003'
where id = '10000000-0000-0000-0000-000000000002';

insert into public.asset_categories (id, name, description, custom_fields_schema)
values
  ('20000000-0000-0000-0000-000000000001', 'Electronics', 'Laptops, projectors, and other IT equipment', '{"warranty_until":"date","processor":"string"}'),
  ('20000000-0000-0000-0000-000000000002', 'Furniture', 'Desks, chairs, and fixtures', '{}'),
  ('20000000-0000-0000-0000-000000000003', 'Vehicles', 'Pool vehicles and transport assets', '{"registration_number":"string"}')
on conflict (id) do nothing;

insert into public.assets (
  id,
  asset_tag,
  name,
  category_id,
  serial_number,
  acquisition_date,
  acquisition_cost,
  condition,
  location,
  status,
  is_bookable,
  registered_by,
  department_id,
  custom_fields
)
values
  ('30000000-0000-0000-0000-000000000001', 'AF-0001', 'Dell XPS 15', '20000000-0000-0000-0000-000000000001', 'DXPS15-001', '2026-01-10', 145000.00, 'good', 'Engineering Floor 2', 'allocated', false, '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{"processor":"Intel i7"}'),
  ('30000000-0000-0000-0000-000000000002', 'AF-0002', 'Meeting Room Projector', '20000000-0000-0000-0000-000000000001', 'PRJ-ROOM-A', '2026-02-12', 78000.00, 'good', 'Conference Room A', 'available', true, '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '{}'),
  ('30000000-0000-0000-0000-000000000003', 'AF-0003', 'Standing Desk', '20000000-0000-0000-0000-000000000002', 'DESK-221', '2026-03-01', 32000.00, 'new', 'Engineering Floor 2', 'available', false, '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{}'),
  ('30000000-0000-0000-0000-000000000004', 'AF-0004', 'Pool Vehicle 1', '20000000-0000-0000-0000-000000000003', 'CAR-POOL-1', '2025-12-01', 750000.00, 'good', 'Basement Parking', 'available', true, '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '{"registration_number":"MH01AB1234"}'),
  ('30000000-0000-0000-0000-000000000005', 'AF-0005', 'Spare MacBook Air', '20000000-0000-0000-0000-000000000001', 'MBA-SPARE-01', '2026-04-15', 98000.00, 'new', 'IT Store', 'under_maintenance', false, '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '{}')
on conflict (id) do nothing;

insert into public.allocations (
  id,
  asset_id,
  allocated_to_user_id,
  allocated_by_id,
  expected_return_date,
  status
)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', current_date + 14, 'active')
on conflict (id) do nothing;

insert into public.bookings (
  id,
  resource_id,
  booked_by_id,
  start_time,
  end_time,
  purpose,
  status
)
values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', now() + interval '1 day', now() + interval '1 day 1 hour', 'Sprint planning', 'upcoming'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', now() + interval '2 days', now() + interval '2 days 3 hours', 'Client visit', 'upcoming')
on conflict (id) do nothing;

insert into public.maintenance_requests (
  id,
  asset_id,
  raised_by_id,
  approved_by_id,
  assigned_technician_id,
  description,
  priority,
  status
)
values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Battery health warning and keyboard intermittently failing.', 'high', 'assigned')
on conflict (id) do nothing;

insert into public.audit_cycles (
  id,
  name,
  scope_type,
  scope_id,
  start_date,
  end_date,
  status,
  created_by_id
)
values
  ('70000000-0000-0000-0000-000000000001', 'Q3 Engineering Asset Audit', 'department', '10000000-0000-0000-0000-000000000002', current_date, current_date + 7, 'in_progress', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.audit_cycle_auditors (audit_cycle_id, auditor_id)
values ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005')
on conflict (audit_cycle_id, auditor_id) do nothing;

insert into public.audit_items (audit_cycle_id, asset_id, verification_status)
values
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'pending'),
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'pending')
on conflict (audit_cycle_id, asset_id) do nothing;

insert into public.transfer_requests (
  id,
  allocation_id,
  requested_by_id,
  status,
  reason
)
values
  ('80000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'pending', 'Need laptop for onboarding a new engineer next week.')
on conflict (id) do nothing;

insert into public.notifications (user_id, type, title, message, metadata)
values
  ('00000000-0000-0000-0000-000000000004', 'asset_assigned', 'Asset assigned', 'Dell XPS 15 has been assigned to you.', '{"asset_tag":"AF-0001"}'),
  ('00000000-0000-0000-0000-000000000002', 'maintenance_approved', 'Maintenance queued', 'Spare MacBook Air has been assigned for technician review.', '{"asset_tag":"AF-0005"}'),
  ('00000000-0000-0000-0000-000000000005', 'audit_assigned', 'Audit assignment', 'You are assigned to Q3 Engineering Asset Audit.', '{"cycle":"Q3 Engineering Asset Audit"}');
