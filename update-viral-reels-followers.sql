-- SQL migration script to update viral_reels table
-- Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

ALTER TABLE public.viral_reels ADD COLUMN IF NOT EXISTS followers_text text;
