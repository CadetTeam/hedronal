import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import { getProfileByClerkId } from '../config/supabase';
import { z } from 'zod';

const createInviteSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string(),
  message: z.string().optional(),
  entity_id: z.string().uuid().optional(), // Optional: if not provided, use user's first entity
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

      // Get current user's profile
      const profile = await getProfileByClerkId(req.userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const validatedData = createInviteSchema.parse(req.body);

      // Get entity_id - use provided one or find user's first entity
      let entityId = validatedData.entity_id;
      if (!entityId) {
        const { data: userEntities } = await supabase
          .from('entities')
          .select('id')
          .eq('created_by', profile.id)
          .limit(1);

        if (!userEntities || userEntities.length === 0) {
          return res
            .status(400)
            .json({ error: 'You must create an entity before sending invites' });
        }
        entityId = userEntities[0].id;
      }

      // Generate invite token
      const inviteToken = require('crypto').randomBytes(32).toString('hex');

      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Use entity_invitations table
      const { data, error } = await supabase
        .from('entity_invitations')
        .insert({
          entity_id: entityId,
          invited_by: profile.id,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
          name: validatedData.name,
          message: validatedData.message || null,
          status: 'pending',
          invite_token: inviteToken,
          expires_at: expiresAt.toISOString(),
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

      // Get current user's profile
      const profile = await getProfileByClerkId(req.userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Fetch invites sent by this user (across all their entities)
      const { data: userEntities } = await supabase
        .from('entities')
        .select('id')
        .eq('created_by', profile.id);

      const entityIds = userEntities ? userEntities.map(e => e.id) : [];

      if (entityIds.length === 0) {
        return res.json({ invites: [] });
      }

      // Fetch invites for all entities created by this user
      const { data: invites, error } = await supabase
        .from('entity_invitations')
        .select('*')
        .in('entity_id', entityIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[inviteController] Error fetching invites:', error);
        return res.status(500).json({ error: 'Failed to fetch invites' });
      }

      // Format invites to match frontend expectations
      const formattedInvites = (invites || []).map((invite: any) => ({
        id: invite.id,
        recipient_email: invite.email,
        recipient_phone_number: invite.phone,
        recipient_name: invite.name,
        status: invite.status,
        recipient_profile_id: null, // Will be set when invite is accepted
        created_at: invite.created_at,
        expires_at: invite.expires_at,
      }));

      res.json({ invites: formattedInvites });
    } catch (error: any) {
      console.error('[inviteController] list error:', error);
      res.status(500).json({ error: error.message || 'Failed to list invites' });
    }
  },

  /**
   * Delete an invite
   * DELETE /api/invites/:id
   */
  delete: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

      // Get current user's profile
      const profile = await getProfileByClerkId(req.userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Fetch entity IDs created by this user to ensure they own the invite
      const { data: userEntities, error: entitiesError } = await supabase
        .from('entities')
        .select('id')
        .eq('created_by', profile.id);

      if (entitiesError) {
        console.error('[inviteController] Error fetching user entities:', entitiesError);
        return res.status(500).json({ error: 'Failed to delete invite' });
      }

      const entityIds = userEntities ? userEntities.map(e => e.id) : [];

      if (entityIds.length === 0) {
        return res.status(403).json({ error: 'You do not have permission to delete this invite' });
      }

      // Delete invite only if it belongs to one of the user's entities
      const { error: deleteError } = await supabase
        .from('entity_invitations')
        .delete()
        .eq('id', id)
        .in('entity_id', entityIds);

      if (deleteError) {
        console.error('[inviteController] Error deleting invite:', deleteError);
        return res.status(500).json({ error: 'Failed to delete invite' });
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error('[inviteController] delete error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete invite' });
    }
  },
};
