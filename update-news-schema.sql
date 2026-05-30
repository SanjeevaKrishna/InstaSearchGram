-- ============================================================
-- InstaSearch - Supabase Database Schema Updates for News
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Add manual date and order index columns to the news table
alter table news add column if not exists published_date text;
alter table news add column if not exists order_index integer default 0;

-- Optional index on order_index to optimize sorted queries
create index if not exists idx_news_order on news(order_index asc);
