-- Migration: Add section display flags for Most Liked Posts
-- Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

ALTER TABLE public.most_liked_posts ADD COLUMN IF NOT EXISTS show_in_most_liked BOOLEAN DEFAULT false;
ALTER TABLE public.most_liked_posts ADD COLUMN IF NOT EXISTS show_in_all_posts BOOLEAN DEFAULT true;

-- Update existing rows so present available posts are in 'all' section
UPDATE public.most_liked_posts SET show_in_all_posts = true WHERE show_in_all_posts IS NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
