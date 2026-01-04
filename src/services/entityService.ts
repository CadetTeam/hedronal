// Entity service for creating entities with Clerk organizations via backend API
import { useOrganization, useOrganizationList } from '@clerk/clerk-expo';
import { useClerkContext } from '../context/ClerkContext';
import { useAuth } from '@clerk/clerk-expo';

const API_BASE_URL = __DEV__ ? 'http://localhost:3000/api' : 'https://hedronal-production.up.railway.app/api';

export interface EntityData {
  name: string;
  handle: string;
  brief: string;
  banner?: string;
  avatar?: string;
  type?: string;
  socialLinks: Array<{ type: string; url: string }>;
  step2Data: { [key: string]: any };
  completedItems: string[];
}

export interface CreateEntityResult {
  success: boolean;
  entityId?: string;
  clerkOrgId?: string;
  error?: string;
}

/**
 * Creates an entity via backend API
 */
export async function createEntity(
  entityData: EntityData,
  clerkUserId: string,
  clerkOrgId?: string,
  clerkToken?: string
): Promise<CreateEntityResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/entities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
      body: JSON.stringify({
        name: entityData.name,
        handle: entityData.handle,
        brief: entityData.brief,
        banner_url: entityData.banner || null,
        avatar_url: entityData.avatar || null,
        type: entityData.type || null,
        clerk_organization_id: clerkOrgId || null,
        socialLinks: entityData.socialLinks,
        step2Data: entityData.step2Data,
        completedItems: entityData.completedItems,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Failed to create entity',
      };
    }

    const result = await response.json();
    return {
      success: result.success,
      entityId: result.entityId,
      clerkOrgId: result.clerkOrgId,
    };
  } catch (error: any) {
    console.error('Error creating entity:', error);
    return {
      success: false,
      error: error?.message || 'Failed to create entity',
    };
  }
}

/**
 * Hook to use entity creation with Clerk organizations
 * Use this hook in components that need to create entities
 */
export function useEntityCreation() {
  const { userId, user } = useClerkContext();
  const { getToken } = useAuth();
  const { createOrganization } = useOrganization();
  const { organizationList } = useOrganizationList();

  const createEntityWithOrganization = async (entityData: EntityData) => {
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    try {
      // Get Clerk session token for backend authentication
      const token = await getToken();

      // Create Clerk organization
      const org = await createOrganization({
        name: entityData.name,
        slug: entityData.handle,
      });

      // Create entity via backend API with organization ID
      const result = await createEntity(
        entityData,
        userId,
        org.id,
        token || undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create entity');
      }

      return {
        ...result,
        clerkOrgId: org.id,
      };
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to create entity with organization');
    }
  };

  return {
    createEntityWithOrganization,
    organizationList,
  };
}

