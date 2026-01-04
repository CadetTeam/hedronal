// Entity service for creating entities with Clerk organizations via backend API
import { useOrganization, useOrganizationList } from '@clerk/clerk-expo';
import { useClerkContext } from '../context/ClerkContext';
import { useAuth } from '@clerk/clerk-expo';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://hedronal-production.up.railway.app/api';

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
 * Fetches entities from the backend API
 */
export async function fetchEntities(clerkToken?: string): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/entities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching entities:', error);
      return [];
    }

    const result = await response.json();
    return result.entities || [];
  } catch (error: any) {
    console.error('Error fetching entities:', error);
    return [];
  }
}

/**
 * Fetches a single entity by ID from the backend API
 */
export async function fetchEntityById(entityId: string, clerkToken?: string): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/entities/${entityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching entity:', error);
      return null;
    }

    const result = await response.json();
    return result.entity || null;
  } catch (error: any) {
    console.error('Error fetching entity:', error);
    return null;
  }
}

/**
 * Hook to use entity creation with Clerk organizations
 * Use this hook in components that need to create entities
 */
export function useEntityCreation() {
  const { userId, user } = useClerkContext();
  const { getToken } = useAuth();
  const { createOrganization, isLoaded: orgListLoaded } = useOrganizationList();

  const createEntityWithOrganization = async (entityData: EntityData) => {
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    if (!orgListLoaded) {
      throw new Error('Organization list is still loading. Please wait and try again.');
    }

    if (!createOrganization) {
      throw new Error('Organization creation is not available. Please ensure you are signed in.');
    }

    try {
      console.log('[useEntityCreation] Creating Clerk organization:', {
        name: entityData.name,
        slug: entityData.handle,
      });

      // Get Clerk session token for backend authentication
      const token = await getToken();

      // Create Clerk organization using useOrganizationList().createOrganization
      const org = await createOrganization({
        name: entityData.name,
        slug: entityData.handle,
      });

      console.log('[useEntityCreation] Clerk organization created:', org?.id);

      if (!org || !org.id) {
        throw new Error('Failed to create Clerk organization - no organization ID returned');
      }

      console.log('[useEntityCreation] Creating entity via backend API with org ID:', org.id);

      // Create entity via backend API with organization ID
      const result = await createEntity(entityData, userId, org.id, token || undefined);

      if (!result.success) {
        console.error('[useEntityCreation] Backend entity creation failed:', result.error);
        throw new Error(result.error || 'Failed to create entity');
      }

      console.log('[useEntityCreation] Entity created successfully:', result.entityId);

      return {
        ...result,
        clerkOrgId: org.id,
      };
    } catch (error: any) {
      console.error('[useEntityCreation] Error creating entity with organization:', error);
      throw new Error(error?.message || 'Failed to create entity with organization');
    }
  };

  return {
    createEntityWithOrganization,
  };
}
