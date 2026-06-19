-- ============================================================
-- InstaSearch - Create chat_backgrounds table (Chat Customization)
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists chat_backgrounds (
  id uuid default gen_random_uuid() primary key,
  room text not null unique, -- 'all', 'hindi', 'telugu', 'tamil', 'kannada', 'malayalam'
  image_url text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table chat_backgrounds enable row level security;

-- Public Select Policy (allowing anyone to view backgrounds)
create policy "Public read chat backgrounds" 
  on chat_backgrounds for select 
  using (true);

-- Only Service Role / Admin can write (insert/update/delete) which is handled by our API server
