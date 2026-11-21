-- SQL script to add is_featured column to most_followed table
-- Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

ALTER TABLE public.most_followed ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
