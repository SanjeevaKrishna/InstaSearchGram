-- ==============================================================================
-- PROFILE & CELEBRITY COMMENTS SCHEMA (Lightweight, Fast, 500MB Quota Friendly)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS profile_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL, -- 'profile' or 'celebrity'
  target_slug VARCHAR(120) NOT NULL,
  parent_id UUID REFERENCES profile_comments(id) ON DELETE CASCADE,
  author_name VARCHAR(40) NOT NULL DEFAULT 'Anonymous',
  avatar_emoji VARCHAR(10) NOT NULL DEFAULT '🔥',
  avatar_color VARCHAR(80) NOT NULL DEFAULT 'linear-gradient(135deg, #6366f1, #a855f7)',
  content VARCHAR(500) NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  dislikes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_target ON profile_comments(target_type, target_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON profile_comments(parent_id);

ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read comments" ON profile_comments;
CREATE POLICY "Public read comments" ON profile_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert comments" ON profile_comments;
CREATE POLICY "Public insert comments" ON profile_comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update comments" ON profile_comments;
CREATE POLICY "Public update comments" ON profile_comments FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION increment_comment_like(comment_id UUID, amount INT)
RETURNS VOID AS 
BEGIN
  UPDATE profile_comments
  SET likes_count = GREATEST(0, likes_count + amount)
  WHERE id = comment_id;
END;
 LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comment_dislike(comment_id UUID, amount INT)
RETURNS VOID AS 
BEGIN
  UPDATE profile_comments
  SET dislikes_count = GREATEST(0, dislikes_count + amount)
  WHERE id = comment_id;
END;
LANGUAGE plpgsql;

-- Optional columns for explicit daily engagement boost tracking
-- (The application automatically handles daily boosts seamlessly with or without these)
ALTER TABLE profile_comments ADD COLUMN IF NOT EXISTS auto_boost_rate INT DEFAULT 3;
ALTER TABLE profile_comments ADD COLUMN IF NOT EXISTS last_boost_date DATE DEFAULT CURRENT_DATE;
