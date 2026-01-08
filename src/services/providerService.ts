import { API_BASE_URL } from './api';

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
    const response = await fetch(
      `${API_BASE_URL}/providers/category/${encodeURIComponent(category)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[fetchProvidersByCategory] API error:', error);
      return [];
    }

    const result = await response.json();
    return result.providers || [];
  } catch (error: any) {
    console.error('[fetchProvidersByCategory] Network error:', error);
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
