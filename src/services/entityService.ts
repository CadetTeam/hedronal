// Entity service for creating entities with Clerk organizations via backend API
import { useOrganization, useOrganizationList } from '@clerk/clerk-expo';
import { useClerkContext } from '../context/ClerkContext';
import { useAuth } from '@clerk/clerk-expo';
import { uploadEntityImages } from '../utils/imageUpload';

// For React Native, localhost doesn't work on physical devices or simulators
// Use production URL by default, or set EXPO_PUBLIC_API_URL for local development
// For local dev, use your machine's IP: http://YOUR_LOCAL_IP:3000/api
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://hedronal-production.up.railway.app/api';

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
    console.log('[createEntity] Sending request to:', `${API_BASE_URL}/entities`);
    console.log('[createEntity] Request payload:', {
      name: entityData.name,
      handle: entityData.handle,
      brief: entityData.brief,
      clerk_organization_id: clerkOrgId,
      hasToken: !!clerkToken,
    });

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

    console.log('[createEntity] Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = 'Failed to create entity';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || JSON.stringify(error);
        console.error('[createEntity] Backend error response:', error);
      } catch (parseError) {
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
        console.error('[createEntity] Failed to parse error response:', text);
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    const result = await response.json();
    console.log('[createEntity] Success response:', {
      success: result.success,
      entityId: result.entityId,
      clerkOrgId: result.clerkOrgId,
    });
    return {
      success: result.success,
      entityId: result.entityId,
      clerkOrgId: result.clerkOrgId,
    };
  } catch (error: any) {
    console.error('[createEntity] Network/parsing error:', error);
    console.error('[createEntity] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });

    // Handle specific React Native fetch errors
    let errorMessage = error?.message || 'Failed to create entity';
    if (
      error?.message?.includes('failed to respond') ||
      error?.message?.includes('Network request failed')
    ) {
      errorMessage = 'Backend service is unavailable. Please check your connection and try again.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetches entities from the backend API
 */
export async function fetchEntities(clerkToken?: string): Promise<any[]> {
  try {
    console.log('[fetchEntities] Fetching from:', API_BASE_URL);
    console.log('[fetchEntities] Token provided:', clerkToken ? 'Yes' : 'No');

    if (!clerkToken) {
      console.warn('[fetchEntities] No token provided - request may fail');
    }

    const response = await fetch(`${API_BASE_URL}/entities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[fetchEntities] API error:', error);
      console.error('[fetchEntities] Response status:', response.status);

      // If it's a 401, the token might be invalid or expired
      if (response.status === 401) {
        console.error('[fetchEntities] Authentication failed - token may be invalid or expired');
      }

      return [];
    }

    const result = await response.json();
    console.log('[fetchEntities] Success, entities count:', result.entities?.length || 0);
    return result.entities || [];
  } catch (error: any) {
    console.error('[fetchEntities] Network error:', error);
    console.error('[fetchEntities] Error details:', {
      message: error?.message,
      stack: error?.stack,
      API_BASE_URL,
    });
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

      console.log('[useEntityCreation] Uploading images via backend API...');

      // Upload images via backend API first
      let avatarUrl: string | null = null;
      let bannerUrl: string | null = null;

      if (entityData.avatar || entityData.banner) {
        try {
          const uploadedImages = await uploadEntityImages(
            entityData.avatar,
            entityData.banner,
            token || undefined
          );
          avatarUrl = uploadedImages.avatar_url;
          bannerUrl = uploadedImages.banner_url;
          console.log('[useEntityCreation] Images uploaded:', { avatarUrl, bannerUrl });
        } catch (imageError: any) {
          console.error('[useEntityCreation] Image upload failed:', imageError);
          // Continue with entity creation even if image upload fails
          // Images will be null and can be added later
        }
      }

      // Update entity data with uploaded image URLs (convert null to undefined)
      const entityDataWithUrls = {
        ...entityData,
        avatar: avatarUrl || undefined,
        banner: bannerUrl || undefined,
      };

      console.log('[useEntityCreation] Creating entity via backend API with org ID:', org.id);

      // Create entity via backend API with organization ID and image URLs
      const result = await createEntity(entityDataWithUrls, userId, org.id, token || undefined);

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
