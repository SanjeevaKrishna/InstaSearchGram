-- Migration: Add description and why_notable columns to most viewed section tables (excluding viral_reels)
-- Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

ALTER TABLE public.most_viewed_reels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.most_viewed_reels ADD COLUMN IF NOT EXISTS why_notable TEXT;

ALTER TABLE public.most_liked_reels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.most_liked_reels ADD COLUMN IF NOT EXISTS why_notable TEXT;

ALTER TABLE public.most_liked_posts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.most_liked_posts ADD COLUMN IF NOT EXISTS why_notable TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
