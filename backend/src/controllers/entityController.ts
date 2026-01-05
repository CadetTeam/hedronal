import { Request, Response } from 'express';
import { supabase, getProfileByClerkId } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import { clerk } from '../config/clerk';
import { z } from 'zod';

const createEntitySchema = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  brief: z.string().min(1),
  banner_url: z.string().optional(),
  avatar_url: z.string().optional(),
  type: z
    .enum([
      'Fund',
      'SPV',
      'Software Company',
      'Service Org',
      'NonProfit',
      'Trust',
      'Donor Advised Fund',
    ])
    .optional(),
  clerk_organization_id: z.string().optional(),
  socialLinks: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
      })
    )
    .optional(),
  step2Data: z.record(z.any()).optional(),
  completedItems: z.array(z.string()).optional(),
  invitedContacts: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .optional(),
});

export const entityController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('[entityController] Creating entity for user:', req.userId);
      console.log('[entityController] Request body keys:', Object.keys(req.body));
      console.log('[entityController] Request body summary:', {
        name: req.body.name,
        handle: req.body.handle,
        hasBanner: !!req.body.banner_url,
        hasAvatar: !!req.body.avatar_url,
        type: req.body.type,
        clerk_org_id: req.body.clerk_organization_id,
        socialLinksCount: req.body.socialLinks?.length || 0,
        step2DataKeys: req.body.step2Data ? Object.keys(req.body.step2Data) : [],
        completedItemsCount: req.body.completedItems?.length || 0,
        invitedContactsCount: req.body.invitedContacts?.length || 0,
      });

      const validatedData = createEntitySchema.parse(req.body);

      console.log('[entityController] Validated data:', {
        name: validatedData.name,
        handle: validatedData.handle,
        type: validatedData.type,
        clerk_org_id: validatedData.clerk_organization_id,
        socialLinksCount: validatedData.socialLinks?.length || 0,
        step2DataKeys: validatedData.step2Data ? Object.keys(validatedData.step2Data) : [],
        completedItemsCount: validatedData.completedItems?.length || 0,
        invitedContactsCount: validatedData.invitedContacts?.length || 0,
      });

      // Get or create profile
      let profile = await getProfileByClerkId(req.userId);
      if (!profile) {
        console.log('[entityController] Profile not found, creating new profile');
        // Create profile if it doesn't exist
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            clerk_user_id: req.userId,
          })
          .select()
          .single();

        if (profileError) {
          console.error('[entityController] Error creating profile:', profileError);
          return res
            .status(500)
            .json({ error: `Failed to create profile: ${profileError.message}` });
        }

        profile = newProfile;
      }

      if (!profile) {
        console.error('[entityController] Profile is still null after creation attempt');
        return res.status(500).json({ error: 'Failed to get or create profile' });
      }

      console.log('[entityController] Profile found/created:', profile.id);
      console.log(
        '[entityController] Creating entity with clerk_organization_id:',
        validatedData.clerk_organization_id
      );

      // Create entity
      const { data: entity, error: entityError } = await supabase
        .from('entities')
        .insert({
          name: validatedData.name,
          handle: validatedData.handle,
          brief: validatedData.brief,
          banner_url: validatedData.banner_url || null,
          avatar_url: validatedData.avatar_url || null,
          type: validatedData.type || null,
          clerk_organization_id: validatedData.clerk_organization_id || null,
          created_by: profile.id,
        })
        .select()
        .single();

      if (entityError || !entity) {
        console.error('[entityController] Error creating entity:', entityError);
        return res.status(400).json({ error: entityError?.message || 'Failed to create entity' });
      }

      console.log('[entityController] Entity created successfully:', entity.id);

      // Add creator as owner
      const { error: memberError } = await supabase.from('entity_members').insert({
        entity_id: entity.id,
        profile_id: profile.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });

      if (memberError) {
        console.error('[entityController] Error adding entity member:', memberError);
      } else {
        console.log('[entityController] Entity member added successfully');
      }

      // Add social links if provided
      if (validatedData.socialLinks && validatedData.socialLinks.length > 0) {
        const { error: socialLinksError } = await supabase.from('entity_social_links').insert(
          validatedData.socialLinks.map(link => ({
            entity_id: entity.id,
            type: link.type.toLowerCase(),
            url: link.url,
          }))
        );

        if (socialLinksError) {
          console.error('[entityController] Error adding social links:', socialLinksError);
        } else {
          console.log('[entityController] Social links added successfully');
        }
      }

      // Add configuration data if provided
      if (validatedData.step2Data && Object.keys(validatedData.step2Data).length > 0) {
        const configEntries = Object.entries(validatedData.step2Data).map(([key, value]) => ({
          entity_id: entity.id,
          config_type: key,
          config_data: value,
          is_completed: validatedData.completedItems?.includes(key) || false,
        }));

        const { error: configError } = await supabase
          .from('entity_configurations')
          .insert(configEntries);

        if (configError) {
          console.error('[entityController] Error adding configurations:', configError);
        } else {
          console.log('[entityController] Configurations added successfully');
        }
      }

      // Add entity invitations if provided
      if (validatedData.invitedContacts && validatedData.invitedContacts.length > 0) {
        const crypto = require('crypto');
        const invitations = validatedData.invitedContacts.map(contact => {
          const inviteToken = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

          return {
            entity_id: entity.id,
            invited_by: profile.id,
            email: contact.email || null,
            phone: contact.phone || null,
            name: contact.name,
            status: 'pending',
            invite_token: inviteToken,
            expires_at: expiresAt.toISOString(),
          };
        });

        const { error: inviteError } = await supabase
          .from('entity_invitations')
          .insert(invitations);

        if (inviteError) {
          console.error('[entityController] Error adding entity invitations:', inviteError);
        } else {
          console.log(
            '[entityController] Entity invitations added successfully:',
            invitations.length
          );
        }
      }

      console.log('[entityController] Entity creation complete, returning response');

      return res.status(201).json({
        success: true,
        entity,
        entityId: entity.id,
        clerkOrgId: validatedData.clerk_organization_id,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error('[entityController] Validation error:', error.errors);
        return res.status(400).json({
          error: error.errors[0].message,
          details: error.errors,
        });
      }
      console.error('[entityController] Entity creation error:', error);
      console.error('[entityController] Error stack:', error.stack);
      return res.status(500).json({
        error: error.message || 'Failed to create entity',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data: entity, error } = await supabase
        .from('entities')
        .select(
          `
          *,
          entity_social_links (*),
          entity_configurations (*),
          entity_members (
            profile_id,
            role,
            profiles (*)
          )
        `
        )
        .eq('id', id)
        .single();

      if (error || !entity) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      return res.json({ entity });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  getByClerkOrgId: async (req: Request, res: Response) => {
    try {
      const { clerkOrgId } = req.params;

      const { data: entity, error } = await supabase
        .from('entities')
        .select(
          `
          *,
          entity_social_links (*),
          entity_configurations (*),
          entity_members (
            profile_id,
            role,
            profiles (*)
          )
        `
        )
        .eq('clerk_organization_id', clerkOrgId)
        .single();

      if (error || !entity) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      return res.json({ entity });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  list: async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('[entityController] Listing entities for user:', req.userId);

      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { limit = 50, offset = 0 } = req.query;

      console.log('[entityController] Query params:', { limit, offset });

      // Get user's Clerk organizations
      let organizationIds: string[] = [];
      try {
        const userOrganizations = await clerk.users.getOrganizationList({
          userId: req.userId,
        });
        organizationIds = userOrganizations.data.map((org: any) => org.id);
        console.log('[entityController] User organizations:', organizationIds);
      } catch (orgError) {
        console.error('[entityController] Error fetching user organizations:', orgError);
        // Continue with empty array - will return no entities if user has no orgs
      }

      // If user has no organizations, return empty array
      if (organizationIds.length === 0) {
        console.log('[entityController] User has no organizations, returning empty array');
        return res.json({ entities: [] });
      }

      // Filter entities by clerk_organization_id matching user's organizations
      const { data: entities, error } = await supabase
        .from('entities')
        .select(
          `
          *,
          entity_social_links (*),
          entity_configurations (*)
        `
        )
        .in('clerk_organization_id', organizationIds)
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (error) {
        console.error('[entityController] Supabase error:', error);
        return res.status(400).json({ error: error.message });
      }

      console.log('[entityController] Found entities:', entities?.length || 0);
      return res.json({ entities: entities || [] });
    } catch (error: any) {
      console.error('[entityController] List error:', error);
      console.error('[entityController] Error stack:', error.stack);
      return res.status(500).json({
        error: error.message || 'Failed to fetch entities',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Verify user has permission (owner or admin)
      const profile = await getProfileByClerkId(req.userId);
      if (!profile) {
        return res.status(401).json({ error: 'Profile not found' });
      }

      const { data: member } = await supabase
        .from('entity_members')
        .select('role')
        .eq('entity_id', id)
        .eq('profile_id', profile.id)
        .single();

      const { data: entity } = await supabase
        .from('entities')
        .select('created_by')
        .eq('id', id)
        .single();

      if (!entity) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      const isOwner = entity.created_by === profile.id;
      const isAdmin = member?.role === 'owner' || member?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { data: updatedEntity, error } = await supabase
        .from('entities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({ entity: updatedEntity });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
};
