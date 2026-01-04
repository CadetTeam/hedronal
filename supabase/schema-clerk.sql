-- Hedronal Database Schema for Supabase (Clerk Auth Version)
-- This schema is modified to work with Clerk authentication instead of Supabase Auth

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- USERS & AUTHENTICATION (Clerk-based)
-- ============================================

-- User profiles (Clerk user data - no auth.users reference)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL, -- Clerk user ID (primary identifier)
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT CHECK (char_length(bio) <= 120),
  avatar_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Stats
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0
);

-- Social links for profiles
CREATE TABLE IF NOT EXISTS profile_social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('twitter', 'linkedin', 'github', 'instagram', 'website', 'email')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, type)
);

-- ============================================
-- ENTITIES (Organizations)
-- ============================================

-- Entities table (connected to Clerk organizations)
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_organization_id TEXT UNIQUE, -- Clerk organization ID
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL, -- @handle format
  brief TEXT NOT NULL, -- Company bio
  banner_url TEXT,
  avatar_url TEXT,
  type TEXT CHECK (type IN ('Fund', 'SPV', 'Software Company', 'Service Org', 'NonProfit', 'Trust', 'Donor Advised Fund')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Configuration status
  domain_configured BOOLEAN DEFAULT FALSE,
  workspace_configured BOOLEAN DEFAULT FALSE,
  formation_configured BOOLEAN DEFAULT FALSE,
  bank_configured BOOLEAN DEFAULT FALSE,
  cap_table_configured BOOLEAN DEFAULT FALSE,
  crm_configured BOOLEAN DEFAULT FALSE,
  legal_configured BOOLEAN DEFAULT FALSE,
  tax_configured BOOLEAN DEFAULT FALSE,
  accounting_configured BOOLEAN DEFAULT FALSE,
  invoicing_configured BOOLEAN DEFAULT FALSE,
  duns_configured BOOLEAN DEFAULT FALSE,
  lender_configured BOOLEAN DEFAULT FALSE
);

-- Entity social links
CREATE TABLE IF NOT EXISTS entity_social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('twitter', 'linkedin', 'github', 'instagram', 'website', 'email')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, type)
);

-- Entity configuration data (accordion items)
CREATE TABLE IF NOT EXISTS entity_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  config_type TEXT NOT NULL CHECK (config_type IN ('Domain', 'Workspace', 'Formation', 'Bank', 'Cap Table', 'CRM', 'Legal', 'Tax', 'Accounting', 'Invoicing', 'DUNS', 'Lender')),
  config_data JSONB, -- Flexible JSON storage for configuration details
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, config_type)
);

-- Entity members (users who belong to an entity)
CREATE TABLE IF NOT EXISTS entity_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, profile_id)
);

-- Entity invitations
CREATE TABLE IF NOT EXISTS entity_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  email TEXT,
  phone TEXT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invite_token TEXT UNIQUE,
  message TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- ============================================
-- POSTS & CONTENT
-- ============================================

-- Posts (Feed content)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL, -- Optional: post from an entity
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Engagement stats
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, profile_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For nested comments
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- ARTICLES (Explore content)
-- ============================================

-- Articles (Explore page content)
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  read_time TEXT, -- e.g., "5 min"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  -- Engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0
);

-- Article topics (for filtering)
CREATE TABLE IF NOT EXISTS article_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article likes
CREATE TABLE IF NOT EXISTS article_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, profile_id)
);

-- ============================================
-- PEOPLE & CONNECTIONS
-- ============================================

-- User connections (follow/following relationships)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- User blocks
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- People/Contacts (user's saved contacts)
CREATE TABLE IF NOT EXISTS saved_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY & NOTIFICATIONS
-- ============================================

-- Activity feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('post_created', 'post_liked', 'comment_added', 'entity_created', 'entity_joined', 'connection_added', 'article_published')),
  target_id UUID, -- ID of the target (post, entity, etc.)
  target_type TEXT, -- Type of target ('post', 'entity', 'article', etc.)
  metadata JSONB, -- Additional data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);

-- Entities indexes
CREATE INDEX IF NOT EXISTS idx_entities_handle ON entities(handle);
CREATE INDEX IF NOT EXISTS idx_entities_clerk_org_id ON entities(clerk_organization_id);
CREATE INDEX IF NOT EXISTS idx_entities_created_by ON entities(created_by);
CREATE INDEX IF NOT EXISTS idx_entity_members_entity_id ON entity_members(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_members_profile_id ON entity_members(profile_id);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_entity_id ON posts(entity_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- Connections indexes
CREATE INDEX IF NOT EXISTS idx_connections_follower_id ON connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_connections_following_id ON connections(following_id);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_profile_id ON activities(profile_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || description || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(to_tsvector('english', content));

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Note: RLS policies for Clerk will be handled via service role or JWT
-- For now, we'll use service role for backend operations

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (will be enhanced with Clerk JWT verification)
-- Profiles: Public read, own write
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (true);

-- Entities: Public read, authenticated write
CREATE POLICY "Users can view all entities" ON entities FOR SELECT USING (true);
CREATE POLICY "Users can create entities" ON entities FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update entities" ON entities FOR UPDATE USING (true);

-- Posts: Public read, authenticated write
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (true);

-- Articles: Public read, authenticated write
CREATE POLICY "Users can view all articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Users can create articles" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own articles" ON articles FOR UPDATE USING (true);

-- Connections: Users can manage their own connections
CREATE POLICY "Users can view connections" ON connections FOR SELECT USING (true);
CREATE POLICY "Users can create connections" ON connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own connections" ON connections FOR DELETE USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_configurations_updated_at BEFORE UPDATE ON entity_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update followers_count for the user being followed
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    -- Update following_count for the user who is following
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_stats_trigger
  AFTER INSERT OR DELETE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

