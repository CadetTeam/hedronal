import { Request, Response } from 'express';
import { supabase, upsertProfile } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  full_name: z.string().optional(),
  username: z.string().optional(),
  bio: z.string().max(120).optional(),
  avatar_url: z.string().url().optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  socialLinks: z
    .array(
      z.object({
        type: z.string(),
        url: z.string().url(),
      })
    )
    .optional(),
});

export const profileController = {
  /**
   * Get current user's profile
   * GET /api/profiles/me
   */
  getMe: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', req.userId)
        .single();

      if (error) {
        console.error('[profileController] Error fetching profile:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }

      if (!data) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Fetch social links
      const { data: socialLinks, error: socialLinksError } = await supabase
        .from('profile_social_links')
        .select('*')
        .eq('profile_id', data.id);

      if (socialLinksError) {
        console.error('[profileController] Error fetching social links:', socialLinksError);
      }

      res.json({
        profile: {
          ...data,
          socialLinks: socialLinks || [],
        },
      });
    } catch (error: any) {
      console.error('[profileController] getMe error:', error);
      res.status(500).json({ error: error.message || 'Failed to get profile' });
    }
  },

  /**
   * Update current user's profile
   * PATCH /api/profiles/me
   */
  updateMe: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = updateProfileSchema.parse(req.body);
      const { socialLinks, ...profileUpdateData } = validatedData;

      // Get profile ID first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', req.userId)
        .single();

      if (profileError || !profile) {
        console.error('[profileController] Error fetching profile:', profileError);
        return res.status(500).json({ error: 'Failed to find profile' });
      }

      // Update profile data (excluding socialLinks)
      const updateData: any = {
        ...profileUpdateData,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('clerk_user_id', req.userId)
        .select()
        .single();

      if (updateError) {
        console.error('[profileController] Error updating profile:', updateError);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      // Update social links if provided
      if (socialLinks !== undefined) {
        // Delete existing social links
        const { error: deleteError } = await supabase
          .from('profile_social_links')
          .delete()
          .eq('profile_id', profile.id);

        if (deleteError) {
          console.error('[profileController] Error deleting social links:', deleteError);
        }

        // Insert new social links
        if (socialLinks.length > 0) {
          const { error: insertError } = await supabase
            .from('profile_social_links')
            .insert(
              socialLinks.map(link => ({
                profile_id: profile.id,
                type: link.type.toLowerCase(),
                url: link.url,
              }))
            );

          if (insertError) {
            console.error('[profileController] Error inserting social links:', insertError);
          }
        }
      }

      // Fetch updated profile with social links
      const { data: socialLinksData } = await supabase
        .from('profile_social_links')
        .select('*')
        .eq('profile_id', profile.id);

      res.json({
        profile: {
          ...updatedProfile,
          socialLinks: socialLinksData || [],
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('[profileController] updateMe error:', error);
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  },

  /**
   * Get profile by ID
   * GET /api/profiles/:id
   */
  getById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[profileController] Error fetching profile:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }

      if (!data) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Fetch social links
      const { data: socialLinks, error: socialLinksError } = await supabase
        .from('profile_social_links')
        .select('*')
        .eq('profile_id', data.id);

      if (socialLinksError) {
        console.error('[profileController] Error fetching social links:', socialLinksError);
      }

      res.json({
        profile: {
          ...data,
          socialLinks: socialLinks || [],
        },
      });
    } catch (error: any) {
      console.error('[profileController] getById error:', error);
      res.status(500).json({ error: error.message || 'Failed to get profile' });
    }
  },
};

