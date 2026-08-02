-- Migration: Add section display flags for Most Viewed Reels
-- Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

ALTER TABLE public.most_viewed_reels ADD COLUMN IF NOT EXISTS show_in_original BOOLEAN DEFAULT false;
ALTER TABLE public.most_viewed_reels ADD COLUMN IF NOT EXISTS show_in_all_reels BOOLEAN DEFAULT true;

-- Update existing rows so current reels are moved to 'all' of that section
UPDATE public.most_viewed_reels SET show_in_all_reels = true WHERE show_in_all_reels IS NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
