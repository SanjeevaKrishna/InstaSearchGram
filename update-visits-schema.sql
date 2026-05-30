-- ============================================================
-- InstaSearch - Supabase Database Schema Updates for Visitor Tracking
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Create visits table
create table if not exists visits (
  id uuid default gen_random_uuid() primary key,
  visit_date date not null default current_date,
  visitor_hash text not null,
  created_at timestamptz default now(),
  constraint unique_daily_visitor unique (visit_date, visitor_hash)
);

-- Enable Row Level Security (RLS)
alter table visits enable row level security;

-- Allow public inserts (so anon users can log their visits)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'visits' and policyname = 'Allow public inserts on visits'
  ) then
    create policy "Allow public inserts on visits" on visits for insert with check (true);
  end if;
end
$$;
