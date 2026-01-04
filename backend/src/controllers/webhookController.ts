import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { supabase, upsertProfile, getProfileByClerkId } from '../config/supabase';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

export const webhookController = {
  handle: async (req: Request, res: Response) => {
    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get the Svix headers for verification
    const headerPayload = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    // If there are no headers, error out
    if (!headerPayload['svix-id'] || !headerPayload['svix-timestamp'] || !headerPayload['svix-signature']) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret);

    let evt: any;

    // Verify the payload with the headers
    try {
      evt = wh.verify(JSON.stringify(req.body), headerPayload) as any;
    } catch (err) {
      console.error('Webhook verification error:', err);
      return res.status(400).json({ error: 'Verification failed' });
    }

    // Handle the webhook
    const eventType = evt.type;

    try {
      switch (eventType) {
        case 'user.created':
          await handleUserCreated(evt.data);
          break;
        case 'user.updated':
          await handleUserUpdated(evt.data);
          break;
        case 'user.deleted':
          await handleUserDeleted(evt.data);
          break;
        case 'organization.created':
          await handleOrganizationCreated(evt.data);
          break;
        case 'organization.updated':
          await handleOrganizationUpdated(evt.data);
          break;
        case 'organization.deleted':
          await handleOrganizationDeleted(evt.data);
          break;
        case 'organizationMembership.created':
          await handleOrganizationMembershipCreated(evt.data);
          break;
        case 'organizationMembership.updated':
          await handleOrganizationMembershipUpdated(evt.data);
          break;
        case 'organizationMembership.deleted':
          await handleOrganizationMembershipDeleted(evt.data);
          break;
        default:
          console.log(`Unhandled event type: ${eventType}`);
      }

      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      return res.status(500).json({ error: error.message });
    }
  },
};

// User event handlers
async function handleUserCreated(userData: any) {
  const { id, email_addresses, first_name, last_name, username, image_url } = userData;
  
  const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;
  
  await upsertProfile({
    clerk_user_id: id,
    full_name: fullName || undefined,
    username: username || undefined,
    avatar_url: image_url || undefined,
  });

  console.log(`Profile created for Clerk user: ${id}`);
}

async function handleUserUpdated(userData: any) {
  const { id, email_addresses, first_name, last_name, username, image_url } = userData;
  
  const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;
  
  await upsertProfile({
    clerk_user_id: id,
    full_name: fullName || undefined,
    username: username || undefined,
    avatar_url: image_url || undefined,
  });

  console.log(`Profile updated for Clerk user: ${id}`);
}

async function handleUserDeleted(userData: any) {
  const { id } = userData;
  
  const profile = await getProfileByClerkId(id);
  if (profile) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('clerk_user_id', id);

    if (error) {
      throw error;
    }
  }

  console.log(`Profile deleted for Clerk user: ${id}`);
}

// Organization event handlers
async function handleOrganizationCreated(orgData: any) {
  const { id, name, slug, image_url, created_by } = orgData;
  
  // Get the creator's profile
  const creatorProfile = await getProfileByClerkId(created_by);
  if (!creatorProfile) {
    console.error(`Creator profile not found for Clerk user: ${created_by}`);
    return;
  }

  const { data, error } = await supabase
    .from('entities')
    .insert({
      clerk_organization_id: id,
      name: name,
      handle: slug || name.toLowerCase().replace(/\s+/g, '-'),
      brief: '', // Will be updated later
      avatar_url: image_url || null,
      created_by: creatorProfile.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Add creator as owner
  await supabase
    .from('entity_members')
    .insert({
      entity_id: data.id,
      profile_id: creatorProfile.id,
      role: 'owner',
      joined_at: new Date().toISOString(),
    });

  console.log(`Entity created for Clerk organization: ${id}`);
}

async function handleOrganizationUpdated(orgData: any) {
  const { id, name, slug, image_url } = orgData;
  
  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('clerk_organization_id', id)
    .single();

  if (!entity) {
    console.error(`Entity not found for Clerk organization: ${id}`);
    return;
  }

  const { error } = await supabase
    .from('entities')
    .update({
      name: name,
      handle: slug || name.toLowerCase().replace(/\s+/g, '-'),
      avatar_url: image_url || null,
    })
    .eq('id', entity.id);

  if (error) {
    throw error;
  }

  console.log(`Entity updated for Clerk organization: ${id}`);
}

async function handleOrganizationDeleted(orgData: any) {
  const { id } = orgData;
  
  console.log(`[handleOrganizationDeleted] Processing deletion for Clerk organization: ${id}`);
  
  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('clerk_organization_id', id)
    .single();

  if (!entity) {
    console.log(`[handleOrganizationDeleted] No entity found for Clerk organization: ${id}`);
    return;
  }

  console.log(`[handleOrganizationDeleted] Found entity: ${entity.id}, deleting related records...`);

  // Delete related records explicitly to ensure complete cleanup
  // Delete entity configurations
  const { error: configError } = await supabase
    .from('entity_configurations')
    .delete()
    .eq('entity_id', entity.id);

  if (configError) {
    console.error(`[handleOrganizationDeleted] Error deleting configurations:`, configError);
  } else {
    console.log(`[handleOrganizationDeleted] Deleted entity configurations`);
  }

  // Delete entity social links
  const { error: socialLinksError } = await supabase
    .from('entity_social_links')
    .delete()
    .eq('entity_id', entity.id);

  if (socialLinksError) {
    console.error(`[handleOrganizationDeleted] Error deleting social links:`, socialLinksError);
  } else {
    console.log(`[handleOrganizationDeleted] Deleted entity social links`);
  }

  // Delete entity members
  const { error: membersError } = await supabase
    .from('entity_members')
    .delete()
    .eq('entity_id', entity.id);

  if (membersError) {
    console.error(`[handleOrganizationDeleted] Error deleting members:`, membersError);
  } else {
    console.log(`[handleOrganizationDeleted] Deleted entity members`);
  }

  // Finally, delete the entity itself
  const { error: entityError } = await supabase
    .from('entities')
    .delete()
    .eq('id', entity.id);

  if (entityError) {
    console.error(`[handleOrganizationDeleted] Error deleting entity:`, entityError);
    throw entityError;
  }

  console.log(`[handleOrganizationDeleted] Successfully deleted entity ${entity.id} and all related records for Clerk organization: ${id}`);
}

// Organization membership handlers
async function handleOrganizationMembershipCreated(membershipData: any) {
  const { organization, public_user_data } = membershipData;
  
  const profile = await getProfileByClerkId(public_user_data.user_id);
  if (!profile) {
    console.error(`Profile not found for Clerk user: ${public_user_data.user_id}`);
    return;
  }

  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('clerk_organization_id', organization.id)
    .single();

  if (!entity) {
    console.error(`Entity not found for Clerk organization: ${organization.id}`);
    return;
  }

  const role = membershipData.role === 'org:admin' ? 'admin' : 
               membershipData.role === 'org:member' ? 'member' : 'member';

  await supabase
    .from('entity_members')
    .upsert({
      entity_id: entity.id,
      profile_id: profile.id,
      role: role,
      joined_at: new Date().toISOString(),
    }, {
      onConflict: 'entity_id,profile_id',
    });

  console.log(`Entity member added: ${profile.id} to entity ${entity.id}`);
}

async function handleOrganizationMembershipUpdated(membershipData: any) {
  await handleOrganizationMembershipCreated(membershipData);
}

async function handleOrganizationMembershipDeleted(membershipData: any) {
  const { organization, public_user_data } = membershipData;
  
  const profile = await getProfileByClerkId(public_user_data.user_id);
  if (!profile) {
    return;
  }

  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('clerk_organization_id', organization.id)
    .single();

  if (entity) {
    await supabase
      .from('entity_members')
      .delete()
      .eq('entity_id', entity.id)
      .eq('profile_id', profile.id);
  }

  console.log(`Entity member removed: ${profile.id} from entity ${entity?.id}`);
}

