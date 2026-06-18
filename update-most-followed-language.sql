-- ============================================================
-- InstaSearch - Add language filter column to most_followed table
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table most_followed add column if not exists language text;
