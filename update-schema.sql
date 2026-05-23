-- ============================================================
-- InstaSearch - Supabase Database Schema Updates (Live Tab)
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. MOST FOLLOWED TABLE
create table if not exists most_followed (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  photo_url text,
  followers_count bigint not null default 0,
  followers_text text,
  order_index integer default 0,
  created_at timestamptz default now()
);

alter table most_followed enable row level security;

-- Avoid error if policy already exists
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'most_followed' and policyname = 'Public read most_followed'
  ) then
    create policy "Public read most_followed" on most_followed for select using (true);
  end if;
end
$$;

-- 2. VIRAL REELS TABLE
create table if not exists viral_reels (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  creator_name text,
  photo_url text,
  instagram_link text not null,
  order_index integer default 0,
  created_at timestamptz default now()
);

alter table viral_reels enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'viral_reels' and policyname = 'Public read viral_reels'
  ) then
    create policy "Public read viral_reels" on viral_reels for select using (true);
  end if;
end
$$;

-- 3. LIVE SETTINGS TABLE
create table if not exists live_settings (
  id integer primary key default 1,
  live_date text not null default '',
  updated_at timestamptz default now()
);

alter table live_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'live_settings' and policyname = 'Public read live_settings'
  ) then
    create policy "Public read live_settings" on live_settings for select using (true);
  end if;
end
$$;

-- Insert default row
insert into live_settings (id, live_date) values (1, '') on conflict (id) do nothing;

-- ============================================================
-- 4. ADD CREATOR_NAME TO VIRAL REELS (MAY 2026 UPDATE)
-- ============================================================
alter table viral_reels add column if not exists creator_name text;
