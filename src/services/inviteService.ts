// For React Native, localhost doesn't work on physical devices or simulators
// Use production URL by default, or set EXPO_PUBLIC_API_URL for local development
// For local dev, use your machine's IP: http://YOUR_LOCAL_IP:3000/api
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://hedronal-production.up.railway.app/api';
const API_URL = API_BASE_URL;

export interface InviteData {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
}

export async function createInvite(
  inviteData: InviteData,
  clerkToken?: string
): Promise<{ success: boolean; invite?: any; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
      body: JSON.stringify(inviteData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create invite';
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
      invite: result.invite,
    };
  } catch (error: any) {
    console.error('[inviteService] createInvite error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to create invite',
    };
  }
}

export async function getInvites(
  clerkToken?: string
): Promise<{ success: boolean; invites?: any[]; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/invites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch invites';
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
      invites: result.invites || [],
    };
  } catch (error: any) {
    console.error('[inviteService] getInvites error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch invites',
    };
  }
}
