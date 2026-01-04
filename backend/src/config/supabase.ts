import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

if (!SUPABASE_URL) {
  console.warn('⚠️  Missing SUPABASE_URL environment variable');
  console.warn('⚠️  Supabase operations will fail until this is set');
}

if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
  console.warn('⚠️  Missing Supabase key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)');
  console.warn('⚠️  Supabase operations will fail until this is set');
}

// Use service role key for backend (bypasses RLS)
// Fall back to anon key if service role not available
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to get profile by Clerk user ID
export async function getProfileByClerkId(clerkUserId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" - that's okay
    throw error;
  }

  return data;
}

// Helper function to create or update profile
export async function upsertProfile(profileData: {
  clerk_user_id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, {
      onConflict: 'clerk_user_id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
