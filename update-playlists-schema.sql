-- ============================================================
-- InstaSearch - Supabase Database Schema Updates for Playlists
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. CREATE PLAYLISTS TABLE
create table if not exists playlists (
  id uuid default gen_random_uuid() primary key,
  celebrity_id uuid references celebrities(id) on delete cascade,
  name text not null,
  cover_url text,
  created_at timestamptz default now(),
  constraint unique_celebrity_playlist unique (celebrity_id, name)
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
alter table playlists enable row level security;

-- 3. CREATE PUBLIC SELECT POLICY
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'playlists' and policyname = 'Public read playlists'
  ) then
    create policy "Public read playlists" on playlists for select using (true);
  end if;
end
$$;

-- 4. MIGRATE EXISTING PLAYLISTS FROM POSTS TABLE
insert into playlists (celebrity_id, name, cover_url)
select distinct celebrity_id, playlist_name, max(playlist_cover_url)
from posts
where playlist_name is not null and playlist_name != ''
group by celebrity_id, playlist_name
on conflict (celebrity_id, name) do nothing;
