-- Migration: Add most_likes column to celebrities table
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_likes BIGINT DEFAULT 0;
