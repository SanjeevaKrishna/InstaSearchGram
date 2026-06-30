-- Migration: Add average insights columns to celebrities table
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS average_views BIGINT DEFAULT 0;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS average_reel_likes BIGINT DEFAULT 0;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS average_post_likes BIGINT DEFAULT 0;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS followers_interaction NUMERIC DEFAULT 0;
