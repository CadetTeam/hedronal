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
        const { data: memberships } = await clerk.users.getOrganizationMembershipList({
          userId: req.userId,
        });
        organizationIds = memberships.map((membership: any) => membership.organization.id);
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
      // Exclude archived entities from the main list
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

      // Filter out archived entities (handles both cases: column exists or doesn't exist)
      // If column doesn't exist, is_archived will be undefined, so !undefined = true (entity shown)
      const filteredEntities = entities?.filter((e: any) => !e.is_archived) || [];

      console.log('[entityController] Found entities:', filteredEntities?.length || 0);
      return res.json({ entities: filteredEntities || [] });
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
      const { step2Data, completedItems, ...entityUpdate } = req.body || {};

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

      let updatedEntity = null;

      // Update base entity fields if provided
      if (entityUpdate && Object.keys(entityUpdate).length > 0) {
        const { data, error } = await supabase
          .from('entities')
          .update(entityUpdate)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        updatedEntity = data;
      }

      // Upsert configuration data (step2Data / provider selections) if provided
      if (step2Data && typeof step2Data === 'object') {
        const entries = Object.entries(step2Data).map(([configType, configValue]) => ({
          entity_id: id,
          config_type: configType,
          config_data: configValue,
          is_completed: Array.isArray(completedItems) ? completedItems.includes(configType) : false,
        }));

        if (entries.length > 0) {
          const { error: configError } = await supabase
            .from('entity_configurations')
            .upsert(entries, {
              onConflict: 'entity_id,config_type',
            });

          if (configError) {
            console.error('[entityController] Error updating configurations:', configError);
            return res.status(500).json({ error: 'Failed to update configurations' });
          }
        }
      }

      // If we only updated configurations, fetch the latest entity row to return
      if (!updatedEntity) {
        const { data, error } = await supabase.from('entities').select('*').eq('id', id).single();

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        updatedEntity = data;
      }

      return res.json({ entity: updatedEntity });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  archive: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

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
        .select('created_by, clerk_organization_id')
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

      // Update entity to set is_archived = true
      // Note: This requires the is_archived column to exist in the database
      const { data: updatedEntity, error: updateError } = await supabase
        .from('entities')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single();

      if (
        updateError &&
        updateError.message?.includes('column') &&
        updateError.message?.includes('is_archived')
      ) {
        return res.status(500).json({
          error:
            'Archive feature requires database migration. Please add is_archived column to entities table.',
        });
      }

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      // Delete the Clerk organization to free up the handle/slug
      if (entity.clerk_organization_id) {
        try {
          await clerk.organizations.deleteOrganization({
            organizationId: entity.clerk_organization_id,
          });
          console.log(
            `[entityController] Deleted Clerk organization: ${entity.clerk_organization_id}`
          );
        } catch (clerkError: any) {
          // Log but don't fail - entity is already archived in Supabase
          console.error('[entityController] Error deleting Clerk organization:', clerkError);
          // Continue - entity is archived even if Clerk deletion fails
        }
      }

      return res.json({ entity: updatedEntity });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  unarchive: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

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
        .select('created_by, name, handle, clerk_organization_id')
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

      // Recreate Clerk organization if it doesn't exist
      let newClerkOrgId = entity.clerk_organization_id;
      if (!entity.clerk_organization_id) {
        try {
          // Create new Clerk organization
          const newOrg = await clerk.organizations.createOrganization({
            name: entity.name,
            slug: entity.handle.replace('@', ''), // Remove @ if present
            createdBy: req.userId,
          });
          newClerkOrgId = newOrg.id;
          console.log(`[entityController] Created new Clerk organization: ${newClerkOrgId}`);
        } catch (clerkError: any) {
          console.error('[entityController] Error creating Clerk organization:', clerkError);
          // Continue anyway - entity can be unarchived without Clerk org
        }
      } else {
        // Check if organization still exists
        try {
          await clerk.organizations.getOrganization({
            organizationId: entity.clerk_organization_id,
          });
        } catch (clerkError: any) {
          // Organization doesn't exist, create a new one
          try {
            const newOrg = await clerk.organizations.createOrganization({
              name: entity.name,
              slug: entity.handle.replace('@', ''),
              createdBy: req.userId,
            });
            newClerkOrgId = newOrg.id;
            console.log(`[entityController] Recreated Clerk organization: ${newClerkOrgId}`);
          } catch (createError: any) {
            console.error('[entityController] Error recreating Clerk organization:', createError);
            // Continue anyway
          }
        }
      }

      // Update entity to set is_archived = false and update clerk_organization_id if changed
      const updateData: any = { is_archived: false };
      if (newClerkOrgId && newClerkOrgId !== entity.clerk_organization_id) {
        updateData.clerk_organization_id = newClerkOrgId;
      }

      const { data: updatedEntity, error: updateError } = await supabase
        .from('entities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      return res.json({ entity: updatedEntity });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  listArchived: async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('[entityController] Listing archived entities for user:', req.userId);

      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { limit = 50, offset = 0 } = req.query;

      // Get user's Clerk organizations
      let organizationIds: string[] = [];
      try {
        const { data: memberships } = await clerk.users.getOrganizationMembershipList({
          userId: req.userId,
        });
        organizationIds = memberships.map((membership: any) => membership.organization.id);
        console.log('[entityController] User organizations:', organizationIds);
      } catch (orgError) {
        console.error('[entityController] Error fetching user organizations:', orgError);
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

      // Filter to only archived entities (handles both cases: column exists or doesn't exist)
      const archivedEntities = entities?.filter((e: any) => e.is_archived === true) || [];

      console.log('[entityController] Found archived entities:', archivedEntities?.length || 0);
      return res.json({ entities: archivedEntities || [] });
    } catch (error: any) {
      console.error('[entityController] List archived error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to fetch archived entities',
      });
    }
  },

  deletePermanently: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

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
        .select('created_by, clerk_organization_id')
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

      // Delete related records first
      await supabase.from('entity_configurations').delete().eq('entity_id', id);
      await supabase.from('entity_social_links').delete().eq('entity_id', id);
      await supabase.from('entity_members').delete().eq('entity_id', id);

      // Delete the entity
      const { error: deleteError } = await supabase.from('entities').delete().eq('id', id);

      if (deleteError) {
        return res.status(400).json({ error: deleteError.message });
      }

      // If there's a Clerk organization, try to delete it (may already be deleted from archive)
      if (entity.clerk_organization_id) {
        try {
          await clerk.organizations.deleteOrganization({
            organizationId: entity.clerk_organization_id,
          });
          console.log(
            `[entityController] Deleted Clerk organization: ${entity.clerk_organization_id}`
          );
        } catch (clerkError: any) {
          // Log but don't fail - entity is already deleted from Supabase
          console.error(
            '[entityController] Error deleting Clerk organization (may already be deleted):',
            clerkError
          );
        }
      }

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
};
