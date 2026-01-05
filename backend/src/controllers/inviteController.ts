import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import { z } from 'zod';

const createInviteSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string(),
  message: z.string().optional(),
});

export const inviteController = {
  /**
   * Create an invite
   * POST /api/invites
   */
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get current user's profile ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', req.userId)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const validatedData = createInviteSchema.parse(req.body);

      // Generate invite token
      const inviteToken = require('crypto').randomBytes(32).toString('hex');

      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Use saved_contacts table for now, or create a new invites table
      // For now, we'll use saved_contacts and add status field
      const { data, error } = await supabase
        .from('saved_contacts')
        .insert({
          profile_id: profile.id,
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          notes: validatedData.message || `Invite sent: ${inviteToken}`,
        })
        .select()
        .single();

      if (error) {
        console.error('[inviteController] Error creating invite:', error);
        return res.status(500).json({ error: 'Failed to create invite' });
      }

      res.status(201).json({ invite: data });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('[inviteController] create error:', error);
      res.status(500).json({ error: error.message || 'Failed to create invite' });
    }
  },

  /**
   * Get all invites for current user
   * GET /api/invites
   */
  list: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get current user's profile ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', req.userId)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const { data, error } = await supabase
        .from('saved_contacts')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[inviteController] Error fetching invites:', error);
        return res.status(500).json({ error: 'Failed to fetch invites' });
      }

      // Transform saved_contacts to invites format with default status
      const invites = (data || []).map((contact: any) => ({
        ...contact,
        status: 'pending', // Default status since saved_contacts doesn't have status field
      }));

      res.json({ invites });
    } catch (error: any) {
      console.error('[inviteController] list error:', error);
      res.status(500).json({ error: error.message || 'Failed to list invites' });
    }
  },
};

