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
  total_reel_views bigint default 0,
  total_reel_likes bigint default 0,
  total_post_likes bigint default 0,
  total_comments bigint default 0,
  total_shares bigint default 0,
  total_reposts bigint default 0,
  most_likes bigint default 0,
  hide_search boolean default false,
  description text,
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

-- 5. NEWS TABLE (Run this to add the InstaNews feature)
create table if not exists news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  image_url text,
  content text,
  views integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_news_slug on news(slug);
create index if not exists idx_news_created on news(created_at desc);

alter table news enable row level security;
create policy "Public read news"
  on news for select
  using (true);

-- ============================================================
-- 6. MOST FOLLOWED TABLE (Live Tab)
-- ============================================================
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
create policy "Public read most_followed" on most_followed for select using (true);

-- ============================================================
-- 7. VIRAL REELS TABLE (Live Tab)
-- ============================================================
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
create policy "Public read viral_reels" on viral_reels for select using (true);

-- ============================================================
-- 8. LIVE SETTINGS TABLE (Live Tab)
-- ============================================================
create table if not exists live_settings (
  id integer primary key default 1,
  live_date text not null default '',
  updated_at timestamptz default now()
);

alter table live_settings enable row level security;
create policy "Public read live_settings" on live_settings for select using (true);

-- Insert default row
insert into live_settings (id, live_date) values (1, '') on conflict (id) do nothing;

