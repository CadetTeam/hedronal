// For React Native, localhost doesn't work on physical devices or simulators
// Use production URL by default, or set EXPO_PUBLIC_API_URL for local development
// For local dev, use your machine's IP: http://YOUR_LOCAL_IP:3000/api
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://hedronal-production.up.railway.app/api';
const API_URL = API_BASE_URL;

export interface ProfileData {
  full_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string | null;
  banner_url?: string | null;
}

export async function getProfile(
  clerkToken?: string
): Promise<{ success: boolean; profile?: any; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/profiles/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch profile';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || JSON.stringify(error);
      } catch (parseError) {
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    const result = await response.json();
    return {
      success: true,
      profile: result.profile,
    };
  } catch (error: any) {
    console.error('[profileService] getProfile error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch profile',
    };
  }
}

export async function updateProfile(
  updateData: ProfileData,
  clerkToken?: string
): Promise<{ success: boolean; profile?: any; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/profiles/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update profile';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || JSON.stringify(error);
      } catch (parseError) {
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    const result = await response.json();
    return {
      success: true,
      profile: result.profile,
    };
  } catch (error: any) {
    console.error('[profileService] updateProfile error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update profile',
    };
  }
}

export async function getProfileById(
  profileId: string,
  clerkToken?: string
): Promise<{ success: boolean; profile?: any; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/profiles/${profileId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch profile';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || JSON.stringify(error);
      } catch (parseError) {
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    const result = await response.json();
    return {
      success: true,
      profile: result.profile,
    };
  } catch (error: any) {
    console.error('[profileService] getProfileById error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch profile',
    };
  }
}
