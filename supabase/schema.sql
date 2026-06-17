-- TripVault Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- trips table
create table if not exists trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  unlock_at   timestamptz not null,
  created_at  timestamptz not null default now()
);

-- photos table
create table if not exists photos (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references trips(id) on delete cascade,
  storage_path      text not null,
  uploaded_by_name  text,
  created_at        timestamptz not null default now()
);

create index if not exists photos_trip_id_idx on photos(trip_id);

-- Row Level Security
-- No auth required — the trip link is the access control.

alter table trips enable row level security;
alter table photos enable row level security;

-- Allow all read/write for unauthenticated users
create policy "public_all" on trips for all using (true) with check (true);
create policy "public_all" on photos for all using (true) with check (true);


-- Storage bucket
-- Run in the Supabase dashboard: Storage > New bucket
--   Name: trip-photos
--   Public: true
--
-- Or run this in the SQL editor if your Supabase version supports it:
-- insert into storage.buckets (id, name, public) values ('trip-photos', 'trip-photos', true)
--   on conflict (id) do nothing;

-- Storage policy: allow anyone to upload, read, and delete
-- (Supabase dashboard: Storage > trip-photos > Policies > Add policy)
-- Policy for INSERT (upload):
--   Target roles: anon
--   USING: true
-- Policy for SELECT (read):
--   Target roles: anon
--   USING: true
-- Policy for DELETE:
--   Target roles: anon
--   USING: bucket_id = 'trip-photos'
--
-- Or run in the SQL editor:
-- create policy "anon_delete" on storage.objects
--   for delete to anon
--   using (bucket_id = 'trip-photos');


-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Run in the SQL editor to enable live sync across devices:
alter publication supabase_realtime add table photos;
alter publication supabase_realtime add table trips;


-- ─── Migration: add auth to trips ────────────────────────────────────────────

-- Add created_by column (nullable so existing trips are unaffected)
alter table trips
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Index for my-trips queries
create index if not exists trips_created_by_idx on trips(created_by);

-- Supabase Auth configuration (Supabase dashboard: Authentication > URL Configuration)
--   Site URL:      https://your-app.com          (or http://localhost:3000 for dev)
--   Redirect URLs: https://your-app.com/auth/callback
--                  http://localhost:3000/auth/callback
