-- ============================================================
-- InstaSearch - Supabase Database Schema Updates (TikTok Stats & Hide Search)
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. ADD TIKTOK STATS COLUMNS TO CELEBRITIES TABLE
alter table celebrities add column if not exists total_reel_views bigint default 0;
alter table celebrities add column if not exists total_reel_likes bigint default 0;
alter table celebrities add column if not exists total_post_likes bigint default 0;

-- 2. ADD HIDE_SEARCH COLUMN TO CELEBRITIES TABLE
alter table celebrities add column if not exists hide_search boolean default false;
