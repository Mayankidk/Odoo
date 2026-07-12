-- Add photo_url column to maintenance_requests table
-- This stores a URL to a photo attached when raising a maintenance request
alter table public.maintenance_requests
  add column if not exists photo_url text;
