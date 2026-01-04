import { Request, Response } from 'express';
import { supabase, getProfileByClerkId } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
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
});

export const entityController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('[entityController] Creating entity for user:', req.userId);
      console.log('[entityController] Request body:', JSON.stringify(req.body, null, 2));

      const validatedData = createEntitySchema.parse(req.body);

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

      return res.status(201).json({
        success: true,
        entity,
        entityId: entity.id,
        clerkOrgId: validatedData.clerk_organization_id,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Entity creation error:', error);
      return res.status(500).json({ error: error.message || 'Failed to create entity' });
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
      const { limit = 50, offset = 0 } = req.query;

      const { data: entities, error } = await supabase
        .from('entities')
        .select(
          `
          *,
          entity_social_links (*),
          entity_configurations (*)
        `
        )
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({ entities: entities || [] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
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
