-- Migration to replace 'twitter' with 'x' in social link types
-- Run this in Supabase SQL Editor

-- Update existing twitter records to x
UPDATE profile_social_links SET type = 'x' WHERE type = 'twitter';
UPDATE entity_social_links SET type = 'x' WHERE type = 'twitter';

-- Drop old check constraints
ALTER TABLE profile_social_links DROP CONSTRAINT IF EXISTS profile_social_links_type_check;
ALTER TABLE entity_social_links DROP CONSTRAINT IF EXISTS entity_social_links_type_check;

-- Add new check constraints with 'x' instead of 'twitter'
ALTER TABLE profile_social_links ADD CONSTRAINT profile_social_links_type_check 
  CHECK (type IN ('x', 'linkedin', 'github', 'instagram', 'website', 'email'));

ALTER TABLE entity_social_links ADD CONSTRAINT entity_social_links_type_check 
  CHECK (type IN ('x', 'linkedin', 'github', 'instagram', 'website', 'email'));
