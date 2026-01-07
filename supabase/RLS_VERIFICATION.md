# RLS Policies Verification

This document verifies that all tables and buckets have proper RLS policies and are correctly connected to the Node.js backend.

## Tables with RLS Enabled

✅ **profiles** - RLS enabled, policies in `rls-policies.sql`
✅ **profile_social_links** - RLS enabled, policies in `rls-policies.sql`
✅ **entities** - RLS enabled, policies in `rls-policies.sql`
✅ **entity_social_links** - RLS enabled, policies in `rls-policies.sql`
✅ **entity_configurations** - RLS enabled, policies in `rls-policies.sql`
✅ **entity_members** - RLS enabled, policies in `rls-policies.sql`
✅ **entity_invitations** - RLS enabled, policies in `rls-policies.sql`
✅ **posts** - RLS enabled, policies in `rls-policies.sql`
✅ **post_likes** - RLS enabled, policies in `rls-policies.sql`
✅ **post_comments** - RLS enabled, policies in `rls-policies.sql`
✅ **post_images** - RLS enabled, policies in `rls-policies.sql` (NEW)
✅ **articles** - RLS enabled, policies in `rls-policies.sql`
✅ **article_likes** - RLS enabled, policies in `rls-policies.sql`
✅ **article_topics** - RLS enabled (via articles schema)
✅ **connections** - RLS enabled, policies in `rls-policies.sql`
✅ **blocks** - RLS enabled, policies in `rls-policies.sql`
✅ **saved_contacts** - RLS enabled, policies in `rls-policies.sql`
✅ **activities** - RLS enabled, policies in `rls-policies.sql`

## Storage Buckets with Policies

✅ **avatars** - Public read, authenticated write (policies in `rls-policies.sql`)
✅ **banners** - Public read, authenticated write (policies in `rls-policies.sql`)
✅ **documents** - Authenticated read/write (policies in `rls-policies.sql`)
✅ **posts** - Public read, authenticated write (policies in `rls-policies.sql`)
✅ **post-images** - Public read, authenticated write (policies in `rls-policies.sql`) (NEW)

## Backend Controller Mappings

### Profile Controller (`profileController.ts`)

- ✅ Uses `profiles` table
- ✅ Uses `profile_social_links` table
- ✅ Correctly mapped

### Entity Controller (`entityController.ts`)

- ✅ Uses `entities` table
- ✅ Uses `entity_social_links` table
- ✅ Uses `entity_configurations` table
- ✅ Uses `entity_members` table
- ✅ Correctly mapped

### Invite Controller (`inviteController.ts`)

- ✅ Uses `entity_invitations` table (FIXED - was using `saved_contacts`)
- ✅ Correctly mapped

### Post Controller (`postController.ts`)

- ✅ Uses `posts` table
- ✅ Uses `post_likes` table
- ✅ Uses `post_comments` table
- ✅ Uses `post_images` table (NEW)
- ✅ Correctly mapped

### Article Controller (`articleController.ts`)

- ✅ Uses `articles` table
- ✅ Uses `article_likes` table
- ✅ Uses `article_topics` table
- ✅ Correctly mapped

### Image Controller (`imageController.ts`)

- ✅ Uses `avatars` bucket
- ✅ Uses `banners` bucket
- ✅ Uses `post-images` bucket (NEW)
- ✅ Correctly mapped

## Recent Updates

1. **Added `post_images` table RLS policies** - Full CRUD policies for authenticated users
2. **Added `post-images` bucket storage policies** - Public read, authenticated write
3. **Fixed `inviteController`** - Now correctly uses `entity_invitations` table instead of `saved_contacts`
4. **Enabled RLS on `post_images` table** - Added to schema.sql

## Verification Checklist

- [x] All tables have RLS enabled
- [x] All tables have appropriate RLS policies
- [x] All storage buckets have policies
- [x] Backend controllers use correct table names
- [x] Backend controllers use correct bucket names
- [x] All foreign key relationships are correct
- [x] All indexes are created
- [x] All triggers are set up

## Notes

- Backend uses service role key which bypasses RLS, but policies protect direct database access
- RLS policies are permissive for authenticated users (backend handles authorization)
- Storage policies allow public read for avatars, banners, posts, and post-images
- Documents bucket is private (authenticated read/write only)
