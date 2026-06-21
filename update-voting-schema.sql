-- ============================================================
-- InstaSearch - Add Voting System columns to most_followed table
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table most_followed add column if not exists votes integer not null default 0;
alter table most_followed add column if not exists current_vote_rank integer;
alter table most_followed add column if not exists previous_vote_rank integer;
alter table most_followed add column if not exists highest_vote_rank integer;
alter table most_followed add column if not exists lowest_vote_rank integer;
