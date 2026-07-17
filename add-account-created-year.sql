-- SQL script to add account_created_year column to celebrities
-- Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

ALTER TABLE public.celebrities ADD COLUMN IF NOT EXISTS account_created_year integer;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
