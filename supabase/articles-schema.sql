-- Articles schema for Explore page
-- This schema matches the mock data structure from ExploreScreen.tsx
-- Run this in your Supabase SQL editor
-- NOTE: If you get errors about existing tables, use articles-schema-migration.sql instead

-- Drop existing tables if they exist (for clean install)
-- Comment out the DROP statements if you want to preserve existing data
-- DROP TABLE IF EXISTS article_likes CASCADE;
-- DROP TABLE IF EXISTS article_topics CASCADE;
-- DROP TABLE IF EXISTS articles CASCADE;

-- Articles table (matches mock data structure)
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY, -- Using TEXT to match mock IDs like '1', '2', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT NOT NULL,
  author TEXT NOT NULL,
  date TEXT NOT NULL, -- ISO date string like '2024-01-15'
  read_time TEXT NOT NULL, -- e.g., '5 min'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Article topics table (for categorization - denormalized from articles.topic)
CREATE TABLE IF NOT EXISTS article_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article likes table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, profile_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic);
CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_profile_id ON article_likes(profile_id);
CREATE INDEX IF NOT EXISTS idx_article_topics_name ON article_topics(name);

-- Enable RLS (using service_role bypass since we're using Clerk auth)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles (public read, service role write for seeding)
-- Note: Since we're using Clerk auth, RLS policies use service_role for backend operations
CREATE POLICY "Anyone can read articles"
  ON articles FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage articles"
  ON articles FOR ALL
  USING (true); -- Backend uses service_role key which bypasses RLS

-- RLS Policies for article_likes (public read, service role write)
CREATE POLICY "Anyone can read article likes"
  ON article_likes FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage article likes"
  ON article_likes FOR ALL
  USING (true); -- Backend uses service_role key which bypasses RLS

-- RLS Policies for article_topics (public read, service role write)
CREATE POLICY "Anyone can read article topics"
  ON article_topics FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage article topics"
  ON article_topics FOR ALL
  USING (true); -- Backend uses service_role key which bypasses RLS

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_articles_updated_at_trigger ON articles;
CREATE TRIGGER update_articles_updated_at_trigger
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();
