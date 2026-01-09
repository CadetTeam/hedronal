-- Hedronal Database Schema for Supabase
-- This schema defines all tables, relationships, and storage buckets

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- User profiles (extends Clerk user data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clerk_user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
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
  type TEXT NOT NULL CHECK (type IN ('x', 'linkedin', 'github', 'instagram', 'website', 'email')),
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
  type TEXT NOT NULL CHECK (type IN ('x', 'linkedin', 'github', 'instagram', 'website', 'email')),
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
  content TEXT DEFAULT '', -- Can be empty for image-only posts (validation at application level)
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
  id TEXT PRIMARY KEY, -- Using TEXT to match existing structure
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT NOT NULL,
  author TEXT NOT NULL, -- Author name (denormalized)
  date TEXT NOT NULL, -- ISO date string like '2024-01-15'
  read_time TEXT NOT NULL, -- e.g., "5 min"
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Profile ID of creator
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
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
-- STORAGE BUCKETS
-- ============================================

-- Note: Storage buckets are created via Supabase Dashboard or API
-- Required buckets:
-- - avatars: For user and entity avatars
-- - banners: For user and entity banners
-- - documents: For entity documents (legal, tax, etc.)
-- - posts: For post media attachments

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

-- Post images (for posts with multiple images)
CREATE TABLE IF NOT EXISTS post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, display_order)
);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_entity_id ON posts(entity_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_display_order ON post_images(post_id, display_order);

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic);
CREATE INDEX IF NOT EXISTS idx_articles_created_by ON articles(created_by);
CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date DESC);
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
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Entities policies
DROP POLICY IF EXISTS "Users can view all entities" ON entities;
DROP POLICY IF EXISTS "Users can create entities" ON entities;
DROP POLICY IF EXISTS "Entity owners can update their entities" ON entities;
CREATE POLICY "Users can view all entities" ON entities FOR SELECT USING (true);
CREATE POLICY "Users can create entities" ON entities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Entity owners can update their entities" ON entities FOR UPDATE 
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM entity_members 
    WHERE entity_id = entities.id 
    AND profile_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

-- Entity members policies
DROP POLICY IF EXISTS "Users can view entity members" ON entity_members;
DROP POLICY IF EXISTS "Entity owners/admins can manage members" ON entity_members;
CREATE POLICY "Users can view entity members" ON entity_members FOR SELECT USING (true);
CREATE POLICY "Entity owners/admins can manage members" ON entity_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM entity_members em
    WHERE em.entity_id = entity_members.entity_id
    AND em.profile_id = auth.uid()
    AND em.role IN ('owner', 'admin')
  ));

-- Posts policies
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);

-- Articles policies
DROP POLICY IF EXISTS "Users can view all articles" ON articles;
DROP POLICY IF EXISTS "Users can create articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
CREATE POLICY "Users can view all articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Users can create articles" ON articles FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
CREATE POLICY "Users can update own articles" ON articles FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

-- Connections policies
DROP POLICY IF EXISTS "Users can view connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON connections;
CREATE POLICY "Users can view connections" ON connections FOR SELECT USING (
  follower_id = auth.uid() OR following_id = auth.uid()
);
CREATE POLICY "Users can create connections" ON connections FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own connections" ON connections FOR DELETE USING (auth.uid() = follower_id);

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
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entities_updated_at ON entities;
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entity_configurations_updated_at ON entity_configurations;
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

DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON post_likes;
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

DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON post_comments;
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

DROP TRIGGER IF EXISTS update_profile_stats_trigger ON connections;
CREATE TRIGGER update_profile_stats_trigger
  AFTER INSERT OR DELETE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

-- Function to create profile on user signup (via Clerk webhook)
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, clerk_user_id, full_name, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'clerk_user_id',
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would be set up via Supabase dashboard or API
-- after Clerk webhook integration

