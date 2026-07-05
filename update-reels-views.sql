-- SQL script to add views_text column to reels tables
-- Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

ALTER TABLE public.viral_reels ADD COLUMN IF NOT EXISTS views_text text;
ALTER TABLE public.most_viewed_reels ADD COLUMN IF NOT EXISTS views_text text;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
