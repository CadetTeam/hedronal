// Post service for fetching posts from backend API
// For React Native, localhost doesn't work on physical devices or simulators
// Use production URL by default, or set EXPO_PUBLIC_API_URL for local development
// For local dev, use your machine's IP: http://YOUR_LOCAL_IP:3000/api
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://hedronal-production.up.railway.app/api';

export interface Post {
  id: string;
  content: string;
  images?: string[];
  author: string;
  authorCompany: string;
  authorId: string | null;
  authorProfile: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  } | null;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  entity_id?: string | null;
  created_at: string;
}

/**
 * Fetches posts from the backend API
 */
export async function fetchPosts(
  limit?: number,
  offset?: number,
  clerkToken?: string
): Promise<Post[]> {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const url = `${API_BASE_URL}/posts${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('[fetchPosts] Fetching from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[fetchPosts] Non-JSON response:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        preview: text.substring(0, 200),
      });
      return [];
    }

    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('[fetchPosts] API error:', error);
      } catch (parseError) {
        console.error('[fetchPosts] API error (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
        });
      }
      return [];
    }

    const result = await response.json();
    console.log('[fetchPosts] Success, posts count:', result.posts?.length || 0);
    return result.posts || [];
  } catch (error: any) {
    console.error('[fetchPosts] Network error:', error?.message || error);
    return [];
  }
}

/**
 * Fetches likes for a post
 */
export async function fetchPostLikes(
  postId: string,
  clerkToken?: string
): Promise<
  Array<{
    id: string;
    user_id: string;
    profile: {
      id: string;
      full_name: string;
      username?: string;
      avatar_url?: string;
    } | null;
    created_at: string;
  }>
> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/likes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        console.error('[fetchPostLikes] API error:', error);
      } else {
        const text = await response.text();
        console.error('[fetchPostLikes] API error (Non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          preview: text.substring(0, 200),
        });
      }
      return [];
    }

    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      return result.likes || [];
    } else {
      return [];
    }
  } catch (error: any) {
    console.error('[fetchPostLikes] Network error:', error);
    return [];
  }
}

/**
 * Fetches comments for a post
 */
export async function fetchPostComments(
  postId: string,
  clerkToken?: string
): Promise<
  Array<{
    id: string;
    user_id: string;
    content: string;
    profile: {
      id: string;
      full_name: string;
      username?: string;
      avatar_url?: string;
    } | null;
    created_at: string;
  }>
> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        console.error('[fetchPostComments] API error:', error);
      } else {
        const text = await response.text();
        console.error('[fetchPostComments] API error (Non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          preview: text.substring(0, 200),
        });
      }
      return [];
    }

    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      return result.comments || [];
    } else {
      return [];
    }
  } catch (error: any) {
    console.error('[fetchPostComments] Network error:', error);
    return [];
  }
}

/**
 * Creates a comment on a post
 */
export async function createPostComment(
  postId: string,
  content: string,
  parentCommentId?: string,
  clerkToken?: string
): Promise<{
  id: string;
  user_id: string;
  content: string;
  profile: {
    id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
  } | null;
  created_at: string;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
      body: JSON.stringify({
        content,
        parent_comment_id: parentCommentId || null,
      }),
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        console.error('[createPostComment] API error:', error);
      } else {
        const text = await response.text();
        console.error('[createPostComment] API error (Non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          preview: text.substring(0, 200),
        });
      }
      return null;
    }

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('[createPostComment] Network error:', error);
    return null;
  }
}

/**
 * Toggles like on a post
 */
export async function togglePostLike(
  postId: string,
  clerkToken?: string
): Promise<{ liked: boolean } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        console.error('[togglePostLike] API error:', error);
      } else {
        const text = await response.text();
        console.error('[togglePostLike] API error (Non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          preview: text.substring(0, 200),
        });
      }
      return null;
    }

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('[togglePostLike] Network error:', error);
    return null;
  }
}

/**
 * Creates a new post
 */
export async function createPost(
  content: string,
  entityId?: string,
  imageUrls?: string[],
  clerkToken?: string
): Promise<Post | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
      body: JSON.stringify({
        content: content || '',
        ...(entityId && { entity_id: entityId }),
        ...(imageUrls && imageUrls.length > 0 && { image_urls: imageUrls }),
      }),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[createPost] Non-JSON response:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        preview: text.substring(0, 200),
      });
      return null;
    }

    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('[createPost] API error:', error);
      } catch (parseError) {
        console.error('[createPost] API error (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
        });
      }
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('[createPost] Network error:', error?.message || error);
    return null;
  }
}

/**
 * Updates an existing post
 */
export async function updatePost(
  postId: string,
  content: string,
  entityId?: string,
  imageUrls?: string[],
  clerkToken?: string
): Promise<Post | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
      body: JSON.stringify({
        content: content || '',
        ...(entityId && { entity_id: entityId }),
        ...(imageUrls && imageUrls.length > 0 && { image_urls: imageUrls }),
      }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[updatePost] Non-JSON response:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        preview: text.substring(0, 200),
      });
      return null;
    }

    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('[updatePost] API error:', error);
      } catch (parseError) {
        console.error('[updatePost] API error (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
        });
      }
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('[updatePost] Network error:', error?.message || error);
    return null;
  }
}

/**
 * Deletes a post
 */
export async function deletePost(postId: string, clerkToken?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('[deletePost] API error:', error);
      } catch (parseError) {
        console.error('[deletePost] API error (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
        });
      }
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[deletePost] Network error:', error?.message || error);
    return false;
  }
}
