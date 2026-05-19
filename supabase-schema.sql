-- ============================================================
-- InstaSearch - Supabase Database Schema
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. CELEBRITIES TABLE
create table if not exists celebrities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  instagram_handle text,
  followers_count bigint,
  posts_count integer,
  photo_url text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- 2. POSTS TABLE
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  celebrity_id uuid references celebrities(id) on delete cascade,
  post_url text not null,
  post_type text default 'reel', -- 'reel', 'post', 'video'
  caption text,
  post_date date,
  tags text[] default '{}',
  is_most_liked boolean default false,
  is_most_commented boolean default false,
  is_most_viewed boolean default false,
  is_first_post boolean default false,
  created_at timestamptz default now()
);

-- 3. INDEXES (makes search faster)
create index if not exists idx_celebrities_slug on celebrities(slug);
create index if not exists idx_celebrities_name on celebrities using gin(to_tsvector('english', name));
create index if not exists idx_posts_celebrity on posts(celebrity_id);
create index if not exists idx_posts_tags on posts using gin(tags);

-- 4. ROW LEVEL SECURITY (allow public read, block public writes)
alter table celebrities enable row level security;
alter table posts enable row level security;

-- Public can read celebrities
create policy "Public read celebrities"
  on celebrities for select
  using (true);

-- Public can read posts
create policy "Public read posts"
  on posts for select
  using (true);

-- Only service role (admin) can write - this is handled by our API using service role key
-- No insert/update/delete policies needed for anon users

-- ============================================================
-- DONE! Your database is ready.
-- ============================================================
