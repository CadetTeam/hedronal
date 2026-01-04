// Article service for fetching articles from backend API
import { useAuth } from '@clerk/clerk-expo';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://hedronal-production.up.railway.app/api';

export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  topic: string;
  author: string;
  date: string; // ISO date string like '2024-01-15'
  read_time: string; // e.g., '5 min'
  created_at: string;
  updated_at: string;
  likes_count: number;
  isLiked?: boolean;
}

export interface Topic {
  id: string;
  name: string;
  created_at: string;
}

/**
 * Fetches articles from the backend API
 */
export async function fetchArticles(
  topic?: string,
  limit?: number,
  offset?: number,
  clerkToken?: string
): Promise<Article[]> {
  try {
    const params = new URLSearchParams();
    if (topic) params.append('topic', topic);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const url = `${API_BASE_URL}/articles${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('[fetchArticles] Fetching from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[fetchArticles] API error:', error);
      return [];
    }

    const result = await response.json();
    console.log('[fetchArticles] Success, articles count:', result.articles?.length || 0);
    return result.articles || [];
  } catch (error: any) {
    console.error('[fetchArticles] Network error:', error);
    console.error('[fetchArticles] Error details:', {
      message: error?.message,
      stack: error?.stack,
      API_BASE_URL,
    });
    return [];
  }
}

/**
 * Fetches a single article by ID
 */
export async function fetchArticleById(
  articleId: string,
  clerkToken?: string
): Promise<Article | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[fetchArticleById] API error:', error);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('[fetchArticleById] Network error:', error);
    return null;
  }
}

/**
 * Toggles like on an article
 */
export async function toggleArticleLike(
  articleId: string,
  clerkToken?: string
): Promise<{ liked: boolean; likes_count: number } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[toggleArticleLike] API error:', error);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('[toggleArticleLike] Network error:', error);
    return null;
  }
}

/**
 * Fetches all topics
 */
export async function fetchTopics(clerkToken?: string): Promise<Topic[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/topics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[fetchTopics] API error:', error);
      return [];
    }

    const result = await response.json();
    return result.topics || [];
  } catch (error: any) {
    console.error('[fetchTopics] Network error:', error);
    return [];
  }
}
