-- Migration: Add is_archived column to entities table
-- This migration adds support for archiving entities

-- Add is_archived column to entities table
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Create index for better query performance when filtering archived entities
CREATE INDEX IF NOT EXISTS idx_entities_is_archived ON entities(is_archived);

-- Update existing entities to ensure is_archived is false (in case of NULL values)
UPDATE entities 
SET is_archived = FALSE 
WHERE is_archived IS NULL;
