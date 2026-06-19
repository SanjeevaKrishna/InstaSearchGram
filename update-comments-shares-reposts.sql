-- ============================================================
-- InstaSearch - Supabase Database Schema Updates (Comments, Shares & Reposts)
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table celebrities add column if not exists total_comments bigint default 0;
alter table celebrities add column if not exists total_shares bigint default 0;
alter table celebrities add column if not exists total_reposts bigint default 0;
