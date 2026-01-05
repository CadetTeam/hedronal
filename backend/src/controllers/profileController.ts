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

      res.json({ profile: data });
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

      const updateData: any = {
        ...validatedData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('clerk_user_id', req.userId)
        .select()
        .single();

      if (error) {
        console.error('[profileController] Error updating profile:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      res.json({ profile: data });
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

      res.json({ profile: data });
    } catch (error: any) {
      console.error('[profileController] getById error:', error);
      res.status(500).json({ error: error.message || 'Failed to get profile' });
    }
  },
};

