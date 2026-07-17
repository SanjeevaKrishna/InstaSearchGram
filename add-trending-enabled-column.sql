-- SQL script to add trending_enabled column to live_settings
-- Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

ALTER TABLE public.live_settings ADD COLUMN IF NOT EXISTS trending_enabled BOOLEAN DEFAULT true;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
