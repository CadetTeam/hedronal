// For React Native, localhost doesn't work on physical devices or simulators
// Use production URL by default, or set EXPO_PUBLIC_API_URL for local development
// For local dev, use your machine's IP: http://YOUR_LOCAL_IP:3000/api
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://hedronal-production.up.railway.app/api';

export interface Provider {
  id: string;
  category: string;
  company_name: string;
  company_logo: string | null;
  url: string;
  pricing_page_url: string | null;
  pricing: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches providers by category from the backend API
 */
export async function fetchProvidersByCategory(
  category: string,
  clerkToken?: string
): Promise<Provider[]> {
  try {
    const url = `${API_BASE_URL}/providers/category/${encodeURIComponent(category)}`;
    console.log('[fetchProvidersByCategory] Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText || `HTTP ${response.status}` };
      }
      console.error('[fetchProvidersByCategory] API error:', {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      return [];
    }

    const result = await response.json();
    console.log('[fetchProvidersByCategory] Success, providers count:', result.providers?.length || 0);
    return result.providers || [];
  } catch (error: any) {
    console.error('[fetchProvidersByCategory] Network error:', {
      message: error?.message,
      name: error?.name,
      API_BASE_URL,
    });
    // Return empty array on error - UI will show "No providers available"
    return [];
  }
}

/**
 * Fetches all providers from the backend API
 */
export async function fetchAllProviders(clerkToken?: string): Promise<Provider[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/providers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[fetchAllProviders] API error:', error);
      return [];
    }

    const result = await response.json();
    return result.providers || [];
  } catch (error: any) {
    console.error('[fetchAllProviders] Network error:', error);
    return [];
  }
}
