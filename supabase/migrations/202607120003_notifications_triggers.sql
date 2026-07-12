-- Allow users to create notifications for themselves and update RLS policies
drop policy if exists "Managers can create notifications" on public.notifications;
create policy "Anyone can create notifications for themselves or managers for anyone" on public.notifications
  for insert to authenticated with check (public.is_manager() or user_id = auth.uid());

-- Triggers for automatic notifications

-- 1. Allocations Notifications
create or replace function public.handle_allocation_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  v_asset_name varchar;
begin
  select name into v_asset_name from public.assets where id = new.asset_id;

  if (TG_OP = 'INSERT') then
    if new.allocated_to_user_id is not null then
      insert into public.notifications (user_id, type, title, message, metadata)
      values (
        new.allocated_to_user_id,
        'asset_assigned',
        'Asset Assigned',
        'Asset "' || v_asset_name || '" has been assigned to you. Expected return: ' || coalesce(new.expected_return_date::text, 'No return date specified'),
        jsonb_build_object('allocation_id', new.id, 'asset_id', new.asset_id)
      );
    end if;
  elsif (TG_OP = 'UPDATE') then
    if new.status = 'returned' and old.status <> 'returned' and new.allocated_to_user_id is not null then
      insert into public.notifications (user_id, type, title, message, metadata)
      values (
        new.allocated_to_user_id,
        'asset_returned',
        'Asset Returned',
        'Asset "' || v_asset_name || '" return has been processed.',
        jsonb_build_object('allocation_id', new.id, 'asset_id', new.asset_id)
      );
    elsif new.status = 'overdue' and old.status <> 'overdue' and new.allocated_to_user_id is not null then
      insert into public.notifications (user_id, type, title, message, metadata)
      values (
        new.allocated_to_user_id,
        'overdue_return',
        'Overdue Return Alert',
        'Asset "' || v_asset_name || '" is overdue for return! Please return it as soon as possible.',
        jsonb_build_object('allocation_id', new.id, 'asset_id', new.asset_id)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_allocation_change on public.allocations;
create trigger on_allocation_change
  after insert or update on public.allocations
  for each row execute function public.handle_allocation_notification();


-- 2. Maintenance Notifications
create or replace function public.handle_maintenance_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  v_asset_name varchar;
begin
  select name into v_asset_name from public.assets where id = new.asset_id;

  if (TG_OP = 'UPDATE' and old.status <> new.status) then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.raised_by_id,
      'maintenance_' || new.status,
      'Maintenance Request ' || initcap(new.status),
      'Your maintenance request for asset "' || v_asset_name || '" is now ' || new.status || '.' || coalesce(' Notes: ' || new.resolution_notes, ''),
      jsonb_build_object('request_id', new.id, 'asset_id', new.asset_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_maintenance_change on public.maintenance_requests;
create trigger on_maintenance_change
  after update on public.maintenance_requests
  for each row execute function public.handle_maintenance_notification();


-- 3. Booking Notifications
create or replace function public.handle_booking_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  v_resource_name varchar;
begin
  select name into v_resource_name from public.assets where id = new.resource_id;

  if (TG_OP = 'INSERT') then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.booked_by_id,
      'booking_confirmed',
      'Booking Confirmed',
      'Your booking for resource "' || v_resource_name || '" is confirmed starting at ' || to_char(new.start_time, 'YYYY-MM-DD HH24:MI') || '.',
      jsonb_build_object('booking_id', new.id, 'resource_id', new.resource_id)
    );
  elsif (TG_OP = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled') then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.booked_by_id,
      'booking_cancelled',
      'Booking Cancelled',
      'Your booking for resource "' || v_resource_name || '" has been cancelled.',
      jsonb_build_object('booking_id', new.id, 'resource_id', new.resource_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_booking_change on public.bookings;
create trigger on_booking_change
  after insert or update on public.bookings
  for each row execute function public.handle_booking_notification();


-- 4. Transfer Notifications
create or replace function public.handle_transfer_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  v_asset_name varchar;
  v_allocation public.allocations;
begin
  select * into v_allocation from public.allocations where id = new.allocation_id;
  select name into v_asset_name from public.assets where id = v_allocation.asset_id;

  if (TG_OP = 'UPDATE' and old.status <> new.status) then
    if new.status = 'approved' then
      insert into public.notifications (user_id, type, title, message, metadata)
      values (
        new.requested_by_id,
        'transfer_approved',
        'Transfer Approved',
        'Your transfer request for asset "' || v_asset_name || '" has been approved.',
        jsonb_build_object('transfer_request_id', new.id, 'allocation_id', new.allocation_id)
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, type, title, message, metadata)
      values (
        new.requested_by_id,
        'transfer_rejected',
        'Transfer Rejected',
        'Your transfer request for asset "' || v_asset_name || '" was rejected.' || coalesce(' Reason: ' || new.rejection_reason, ''),
        jsonb_build_object('transfer_request_id', new.id, 'allocation_id', new.allocation_id)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_transfer_change on public.transfer_requests;
create trigger on_transfer_change
  after update on public.transfer_requests
  for each row execute function public.handle_transfer_notification();
