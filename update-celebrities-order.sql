-- ============================================================
-- Spialr - Supabase Database Schema Updates (Celebrity Display Order)
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table celebrities add column if not exists order_index integer default 0;
