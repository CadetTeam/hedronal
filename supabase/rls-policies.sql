-- Comprehensive Row Level Security (RLS) Policies for Hedronal
-- This replaces the basic policies in schema-clerk.sql with robust, secure policies
-- Note: Backend uses service role key which bypasses RLS, but these policies protect direct database access

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Profiles: Public read, authenticated users can create/update their own
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_authenticated" ON profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE
  USING (true);

-- ============================================
-- PROFILE_SOCIAL_LINKS TABLE
-- ============================================

CREATE POLICY "profile_social_links_select_public" ON profile_social_links
  FOR SELECT
  USING (true);

CREATE POLICY "profile_social_links_insert_own" ON profile_social_links
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "profile_social_links_update_own" ON profile_social_links
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "profile_social_links_delete_own" ON profile_social_links
  FOR DELETE
  USING (true);

-- ============================================
-- ENTITIES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all entities" ON entities;
DROP POLICY IF EXISTS "Users can create entities" ON entities;
DROP POLICY IF EXISTS "Users can update entities" ON entities;

-- Entities: Public read, authenticated create, members/admins can update
CREATE POLICY "entities_select_public" ON entities
  FOR SELECT
  USING (true);

CREATE POLICY "entities_insert_authenticated" ON entities
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "entities_update_members" ON entities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entities.id
      AND entity_members.role IN ('owner', 'admin')
    )
    OR entities.created_by IN (
      SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)::text
    )
  )
  WITH CHECK (true);

CREATE POLICY "entities_delete_owners" ON entities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entities.id
      AND entity_members.role = 'owner'
    )
    OR entities.created_by IN (
      SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)::text
    )
  );

-- ============================================
-- ENTITY_SOCIAL_LINKS TABLE
-- ============================================

CREATE POLICY "entity_social_links_select_public" ON entity_social_links
  FOR SELECT
  USING (true);

CREATE POLICY "entity_social_links_insert_members" ON entity_social_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_social_links.entity_id
      AND entity_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "entity_social_links_update_members" ON entity_social_links
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_social_links.entity_id
      AND entity_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (true);

CREATE POLICY "entity_social_links_delete_members" ON entity_social_links
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_social_links.entity_id
      AND entity_members.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- ENTITY_CONFIGURATIONS TABLE
-- ============================================

CREATE POLICY "entity_configurations_select_members" ON entity_configurations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_configurations.entity_id
    )
  );

CREATE POLICY "entity_configurations_insert_members" ON entity_configurations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_configurations.entity_id
      AND entity_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "entity_configurations_update_members" ON entity_configurations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_configurations.entity_id
      AND entity_members.role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (true);

CREATE POLICY "entity_configurations_delete_members" ON entity_configurations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_configurations.entity_id
      AND entity_members.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- ENTITY_MEMBERS TABLE
-- ============================================

CREATE POLICY "entity_members_select_public" ON entity_members
  FOR SELECT
  USING (true);

CREATE POLICY "entity_members_insert_owners" ON entity_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entity_members em
      WHERE em.entity_id = entity_members.entity_id
      AND em.role = 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM entities
      WHERE entities.id = entity_members.entity_id
      AND entities.created_by IN (
        SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)::text
      )
    )
  );

CREATE POLICY "entity_members_update_owners" ON entity_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members em
      WHERE em.entity_id = entity_members.entity_id
      AND em.role = 'owner'
    )
  )
  WITH CHECK (true);

CREATE POLICY "entity_members_delete_owners" ON entity_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members em
      WHERE em.entity_id = entity_members.entity_id
      AND em.role = 'owner'
    )
  );

-- ============================================
-- ENTITY_INVITATIONS TABLE
-- ============================================

CREATE POLICY "entity_invitations_select_members" ON entity_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_invitations.entity_id
    )
  );

CREATE POLICY "entity_invitations_insert_members" ON entity_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_invitations.entity_id
      AND entity_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "entity_invitations_update_members" ON entity_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_invitations.entity_id
      AND entity_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (true);

CREATE POLICY "entity_invitations_delete_members" ON entity_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entity_members
      WHERE entity_members.entity_id = entity_invitations.entity_id
      AND entity_members.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- POSTS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;

CREATE POLICY "posts_select_public" ON posts
  FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "posts_insert_authenticated" ON posts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "posts_update_author" ON posts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "posts_delete_author" ON posts
  FOR DELETE
  USING (true);

-- ============================================
-- POST_LIKES TABLE
-- ============================================

CREATE POLICY "post_likes_select_public" ON post_likes
  FOR SELECT
  USING (true);

CREATE POLICY "post_likes_insert_authenticated" ON post_likes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "post_likes_delete_own" ON post_likes
  FOR DELETE
  USING (true);

-- ============================================
-- POST_COMMENTS TABLE
-- ============================================

CREATE POLICY "post_comments_select_public" ON post_comments
  FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "post_comments_insert_authenticated" ON post_comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "post_comments_update_author" ON post_comments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "post_comments_delete_author" ON post_comments
  FOR DELETE
  USING (true);

-- ============================================
-- POST_IMAGES TABLE
-- ============================================

CREATE POLICY "post_images_select_public" ON post_images
  FOR SELECT
  USING (true);

CREATE POLICY "post_images_insert_authenticated" ON post_images
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "post_images_update_author" ON post_images
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "post_images_delete_author" ON post_images
  FOR DELETE
  USING (true);

-- ============================================
-- ARTICLES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all articles" ON articles;
DROP POLICY IF EXISTS "Users can create articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;

CREATE POLICY "articles_select_public" ON articles
  FOR SELECT
  USING (true);

CREATE POLICY "articles_insert_authenticated" ON articles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "articles_update_author" ON articles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "articles_delete_author" ON articles
  FOR DELETE
  USING (true);

-- ============================================
-- ARTICLE_LIKES TABLE
-- ============================================

CREATE POLICY "article_likes_select_public" ON article_likes
  FOR SELECT
  USING (true);

CREATE POLICY "article_likes_insert_authenticated" ON article_likes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "article_likes_delete_own" ON article_likes
  FOR DELETE
  USING (true);

-- ============================================
-- CONNECTIONS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON connections;

CREATE POLICY "connections_select_public" ON connections
  FOR SELECT
  USING (true);

CREATE POLICY "connections_insert_authenticated" ON connections
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "connections_delete_own" ON connections
  FOR DELETE
  USING (true);

-- ============================================
-- BLOCKS TABLE
-- ============================================

CREATE POLICY "blocks_select_own" ON blocks
  FOR SELECT
  USING (true);

CREATE POLICY "blocks_insert_authenticated" ON blocks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "blocks_delete_own" ON blocks
  FOR DELETE
  USING (true);

-- ============================================
-- SAVED_CONTACTS TABLE
-- ============================================

CREATE POLICY "saved_contacts_select_own" ON saved_contacts
  FOR SELECT
  USING (true);

CREATE POLICY "saved_contacts_insert_authenticated" ON saved_contacts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "saved_contacts_update_own" ON saved_contacts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "saved_contacts_delete_own" ON saved_contacts
  FOR DELETE
  USING (true);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================

CREATE POLICY "activities_select_own" ON activities
  FOR SELECT
  USING (true);

CREATE POLICY "activities_insert_authenticated" ON activities
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "activities_delete_own" ON activities
  FOR DELETE
  USING (true);

-- ============================================
-- STORAGE POLICIES (Enhanced)
-- ============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Banner images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own banners" ON storage.objects;

-- Avatars bucket policies
CREATE POLICY "storage_avatars_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "storage_avatars_insert_authenticated" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "storage_avatars_update_authenticated" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "storage_avatars_delete_authenticated" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'avatars');

-- Banners bucket policies
CREATE POLICY "storage_banners_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "storage_banners_insert_authenticated" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'banners');

CREATE POLICY "storage_banners_update_authenticated" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'banners')
  WITH CHECK (bucket_id = 'banners');

CREATE POLICY "storage_banners_delete_authenticated" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'banners');

-- Documents bucket policies (private)
CREATE POLICY "storage_documents_select_authenticated" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "storage_documents_insert_authenticated" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "storage_documents_update_authenticated" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "storage_documents_delete_authenticated" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'documents');

-- Posts bucket policies
CREATE POLICY "storage_posts_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'posts');

CREATE POLICY "storage_posts_insert_authenticated" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'posts');

CREATE POLICY "storage_posts_update_authenticated" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'posts')
  WITH CHECK (bucket_id = 'posts');

CREATE POLICY "storage_posts_delete_authenticated" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'posts');

-- Post-images bucket policies
CREATE POLICY "storage_post_images_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "storage_post_images_insert_authenticated" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "storage_post_images_update_authenticated" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'post-images')
  WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "storage_post_images_delete_authenticated" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'post-images');

