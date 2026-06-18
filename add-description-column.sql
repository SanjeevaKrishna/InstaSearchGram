-- Migration: Add description column to celebrities table
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS description TEXT;
