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
  invitedContacts?: Array<{ id: string; name: string; phone?: string; email?: string }>;
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
      hasSocialLinks: !!(entityData.socialLinks && entityData.socialLinks.length > 0),
      hasStep2Data: !!(entityData.step2Data && Object.keys(entityData.step2Data).length > 0),
      completedItemsCount: entityData.completedItems?.length || 0,
      invitedContactsCount: entityData.invitedContacts?.length || 0,
    });

    // Ensure token is properly formatted
    if (!clerkToken || clerkToken.trim().length === 0) {
      console.error('[createEntity] No token provided for entity creation');
      return {
        success: false,
        error: 'Authentication token is required. Please sign in again.',
      };
    }

    const trimmedToken = clerkToken.trim();
    const authHeader = `Bearer ${trimmedToken}`;
    console.log('[createEntity] Making request with token');
    console.log('[createEntity] Token length:', trimmedToken.length);
    console.log('[createEntity] Token preview:', trimmedToken.substring(0, 30) + '...');
    console.log('[createEntity] API URL:', `${API_BASE_URL}/entities`);

    const response = await fetch(`${API_BASE_URL}/entities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
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
        invitedContacts: entityData.invitedContacts,
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
 * Updates an entity via backend API
 */
export async function updateEntity(
  entityId: string,
  updateData: Partial<EntityData>,
  clerkToken?: string
): Promise<{ success: boolean; entity?: any; error?: string }> {
  try {
    console.log('[updateEntity] Updating entity:', entityId, updateData);

    if (!clerkToken) {
      console.warn('[updateEntity] No token provided - request may fail');
    }

    const response = await fetch(`${API_BASE_URL}/entities/${entityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
      body: JSON.stringify({
        name: updateData.name,
        handle: updateData.handle,
        brief: updateData.brief,
        banner_url: updateData.banner || null,
        avatar_url: updateData.avatar || null,
        type: updateData.type || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[updateEntity] API error:', error);
      console.error('[updateEntity] Response status:', response.status);

      if (response.status === 401) {
        console.error('[updateEntity] Authentication failed - token may be invalid or expired');
        return {
          success: false,
          error: 'Invalid or expired token. Please sign in again.',
        };
      }

      return {
        success: false,
        error: error.error || error.message || 'Failed to update entity',
      };
    }

    const result = await response.json();
    console.log('[updateEntity] Success, updated entity:', result.entity?.id);
    return {
      success: true,
      entity: result.entity,
    };
  } catch (error: any) {
    console.error('[updateEntity] Network error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update entity',
    };
  }
}

/**
 * Hook to use entity creation with Clerk organizations
 * Use this hook in components that need to create entities
 */
export function useEntityCreation() {
  const { userId, user } = useClerkContext();
  const { getToken, isSignedIn } = useAuth();
  const { createOrganization, isLoaded: orgListLoaded } = useOrganizationList();

  const createEntityWithOrganization = async (entityData: EntityData) => {
    if (!userId || !isSignedIn) {
      throw new Error('User must be authenticated. Please sign in and try again.');
    }

    if (!orgListLoaded) {
      throw new Error('Organization list is still loading. Please wait and try again.');
    }

    if (!createOrganization) {
      throw new Error('Organization creation is not available. Please ensure you are signed in.');
    }

    // Verify we can get a token before proceeding
    let testToken = await getToken();
    if (!testToken) {
      testToken = await getToken({ template: 'default' });
    }
    if (!testToken) {
      throw new Error(
        'Unable to retrieve authentication token. Please sign out and sign in again.'
      );
    }

    try {
      console.log('[useEntityCreation] Creating Clerk organization:', {
        name: entityData.name,
        slug: entityData.handle,
      });

      // Create Clerk organization using useOrganizationList().createOrganization
      const org = await createOrganization({
        name: entityData.name,
        slug: entityData.handle,
      });

      console.log('[useEntityCreation] Clerk organization created:', org?.id);

      if (!org || !org.id) {
        throw new Error('Failed to create Clerk organization - no organization ID returned');
      }

      // Wait longer for Clerk to sync the organization and propagate to all services
      console.log('[useEntityCreation] Waiting for Clerk organization sync...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get a fresh token for backend authentication after org creation
      // Try multiple methods to get a valid token with organization context
      let token: string | null = null;
      
      // Method 1: Try with organization context
      try {
        token = await getToken({ template: 'default' });
        if (token) {
          console.log('[useEntityCreation] Token retrieved with template, length:', token.length);
        }
      } catch (templateError) {
        console.log('[useEntityCreation] Template token failed:', templateError);
      }

      // Method 2: Try without template
      if (!token) {
        try {
          token = await getToken();
          if (token) {
            console.log('[useEntityCreation] Token retrieved without template, length:', token.length);
          }
        } catch (defaultError) {
          console.log('[useEntityCreation] Default token failed:', defaultError);
        }
      }

      // Method 3: Try with skipCache to force fresh token
      if (!token) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit more
          token = await getToken({ template: 'default', skipCache: true });
          if (token) {
            console.log('[useEntityCreation] Token retrieved with skipCache, length:', token.length);
          }
        } catch (skipCacheError) {
          console.log('[useEntityCreation] SkipCache token failed:', skipCacheError);
        }
      }

      if (!token) {
        console.error('[useEntityCreation] Failed to get token after org creation');
        throw new Error('Unable to get authentication token. Please sign out and sign in again.');
      }

      console.log('[useEntityCreation] Token retrieved for API calls, length:', token.length);

      console.log('[useEntityCreation] Uploading images via backend API...');

      // Upload images via backend API first
      let avatarUrl: string | null = null;
      let bannerUrl: string | null = null;

      if (entityData.avatar || entityData.banner) {
        try {
          // Get fresh token for image upload
          let uploadToken = await getToken({ template: 'default' });
          if (!uploadToken) {
            uploadToken = await getToken();
          }

          if (!uploadToken) {
            throw new Error('Unable to get token for image upload');
          }

          const uploadedImages = await uploadEntityImages(
            entityData.avatar,
            entityData.banner,
            uploadToken
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

      // Get fresh token right before entity creation to ensure it's valid
      // Use the token we already retrieved, or get a new one if needed
      let createToken: string | null = token;
      
      // If we don't have a token, try to get one more time
      if (!createToken) {
        console.log('[useEntityCreation] Getting fresh token for entity creation...');
        try {
          const freshToken = await getToken({ template: 'default' });
          createToken = freshToken || null;
        } catch (e) {
          console.log('[useEntityCreation] Template token failed, trying default...');
          try {
            const defaultToken = await getToken();
            createToken = defaultToken || null;
          } catch (defaultError) {
            console.log('[useEntityCreation] Default token also failed');
          }
        }
        
        if (!createToken) {
          // Last attempt with skipCache
          try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const skipCacheToken = await getToken({ template: 'default', skipCache: true });
            createToken = skipCacheToken || null;
          } catch (tokenError) {
            console.error('[useEntityCreation] Token retrieval error:', tokenError);
          }
        }
      }

      if (!createToken) {
        throw new Error('Unable to get authentication token. Please sign out and sign in again.');
      }

      console.log('[useEntityCreation] Final token for entity creation, length:', createToken.length);

      // Create entity via backend API with organization ID and image URLs
      const result = await createEntity(entityDataWithUrls, userId, org.id, createToken);

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
