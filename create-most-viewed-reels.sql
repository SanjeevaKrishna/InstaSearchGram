-- SQL script to create most_viewed_reels table
-- Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

create table if not exists public.most_viewed_reels (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  creator_name text,
  photo_url text,
  creator_photo_url text,
  instagram_link text not null,
  order_index integer default 0,
  followers_text text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.most_viewed_reels enable row level security;

-- Drop policy if it exists and create public read policy
drop policy if exists "Public read most_viewed_reels" on public.most_viewed_reels;
create policy "Public read most_viewed_reels" on public.most_viewed_reels for select using (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
