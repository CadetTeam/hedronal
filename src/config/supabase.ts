// Supabase configuration
// These values should be set in your environment variables
// For Expo, use EAS environment variables or .env file

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase URL and key from environment variables
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  '';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  Constants.expoConfig?.extra?.supabaseKey ||
  '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase URL or key is not set. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to your environment variables or EAS secrets.'
  );
}

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Export types for database tables
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          clerk_user_id: string;
          full_name: string | null;
          username: string | null;
          bio: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          created_at: string;
          updated_at: string;
          followers_count: number;
          following_count: number;
          posts_count: number;
          points: number;
        };
        Insert: {
          id: string;
          clerk_user_id: string;
          full_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          created_at?: string;
          updated_at?: string;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          points?: number;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          full_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          created_at?: string;
          updated_at?: string;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          points?: number;
        };
      };
      entities: {
        Row: {
          id: string;
          clerk_organization_id: string | null;
          name: string;
          handle: string;
          brief: string;
          banner_url: string | null;
          avatar_url: string | null;
          type: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          domain_configured: boolean;
          workspace_configured: boolean;
          formation_configured: boolean;
          bank_configured: boolean;
          cap_table_configured: boolean;
          crm_configured: boolean;
          legal_configured: boolean;
          tax_configured: boolean;
          accounting_configured: boolean;
          invoicing_configured: boolean;
          duns_configured: boolean;
          lender_configured: boolean;
        };
        Insert: {
          id?: string;
          clerk_organization_id?: string | null;
          name: string;
          handle: string;
          brief: string;
          banner_url?: string | null;
          avatar_url?: string | null;
          type?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          domain_configured?: boolean;
          workspace_configured?: boolean;
          formation_configured?: boolean;
          bank_configured?: boolean;
          cap_table_configured?: boolean;
          crm_configured?: boolean;
          legal_configured?: boolean;
          tax_configured?: boolean;
          accounting_configured?: boolean;
          invoicing_configured?: boolean;
          duns_configured?: boolean;
          lender_configured?: boolean;
        };
        Update: {
          id?: string;
          clerk_organization_id?: string | null;
          name?: string;
          handle?: string;
          brief?: string;
          banner_url?: string | null;
          avatar_url?: string | null;
          type?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          domain_configured?: boolean;
          workspace_configured?: boolean;
          formation_configured?: boolean;
          bank_configured?: boolean;
          cap_table_configured?: boolean;
          crm_configured?: boolean;
          legal_configured?: boolean;
          tax_configured?: boolean;
          accounting_configured?: boolean;
          invoicing_configured?: boolean;
          duns_configured?: boolean;
          lender_configured?: boolean;
        };
      };
    };
  };
};

