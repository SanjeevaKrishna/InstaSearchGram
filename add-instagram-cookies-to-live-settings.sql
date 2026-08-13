-- ============================================================
-- InstaSearch - Add instagram_session_id and instagram_csrf_token to live_settings table
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table live_settings add column if not exists instagram_session_id text;
alter table live_settings add column if not exists instagram_csrf_token text;
