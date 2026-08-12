-- ============================================================
-- Add Scraper and Manual Override Helper Columns
-- ============================================================

-- Core Profile Info
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS name_scraped text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS name_manual text;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS description_scraped text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS description_manual text;

-- Basic Stats
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS followers_scraped bigint;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS followers_manual bigint;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS posts_scraped integer;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS posts_manual integer;

-- Engagement Totals
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS total_reel_views_scraped bigint;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS total_reel_views_manual bigint;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS total_reel_likes_scraped bigint;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS total_reel_likes_manual bigint;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS total_post_likes_scraped bigint;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS total_post_likes_manual bigint;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS total_comments_scraped bigint;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS total_comments_manual bigint;

-- Averages & Derived Stats
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS average_views_scraped bigint;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS average_views_manual bigint;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS average_reel_likes_scraped bigint;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS average_reel_likes_manual bigint;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS average_post_likes_scraped bigint;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS average_post_likes_manual bigint;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS followers_interaction_scraped numeric;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS followers_interaction_manual numeric;

-- Top Performing Stats
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_likes_scraped bigint;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_likes_manual bigint;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_liked_count_scraped text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_liked_count_manual text;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_commented_count_scraped text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_commented_count_manual text;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_viewed_count_scraped text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_viewed_count_manual text;

-- Dates for top posts (Base Columns)
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_liked_date text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_commented_date text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_viewed_date text;

-- Dates for top posts (Override Columns)
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_liked_date_scraped text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_liked_date_manual text;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_commented_date_scraped text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_commented_date_manual text;

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_viewed_date_scraped text;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS most_viewed_date_manual text;
