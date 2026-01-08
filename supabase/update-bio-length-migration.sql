-- Migration to update bio field length constraint from 120 to 750 characters
-- Run this in Supabase SQL Editor

-- Drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_bio_check;

-- Add new check constraint for 750 characters
ALTER TABLE profiles ADD CONSTRAINT profiles_bio_check CHECK (char_length(bio) <= 750);
