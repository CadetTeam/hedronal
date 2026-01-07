import { Response } from 'express';
import { supabase, getProfileByClerkId } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(1).optional(),
  entity_id: z.string().uuid().optional(),
  image_urls: z.array(z.string().url()).optional(),
});

export const postController = {
  // Get all posts with author profiles
  list: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, offset } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const offsetNum = offset ? parseInt(offset as string, 10) : 0;

      // Fetch posts with author profiles and images
      const { data: posts, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          author:profiles!posts_author_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          ),
          post_images (
            id,
            image_url,
            display_order
          )
        `
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);

      if (error) {
        console.error('[postController] Error fetching posts:', error);
        return res.status(400).json({ error: error.message });
      }

      if (!posts || posts.length === 0) {
        return res.json({
          posts: [],
          total: 0,
        });
      }

      // Fetch like counts for all posts
      const postIds = posts.map((post: any) => post.id);
      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds);

      if (likesError) {
        console.warn('[postController] Error fetching likes:', likesError);
      }

      // Count likes per post
      const likesCountMap: { [key: string]: number } = {};
      if (likesData) {
        likesData.forEach((like: any) => {
          likesCountMap[like.post_id] = (likesCountMap[like.post_id] || 0) + 1;
        });
      }

      // Fetch comment counts
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds)
        .is('deleted_at', null);

      if (commentsError) {
        console.warn('[postController] Error fetching comments:', commentsError);
      }

      const commentsCountMap: { [key: string]: number } = {};
      if (commentsData) {
        commentsData.forEach((comment: any) => {
          commentsCountMap[comment.post_id] = (commentsCountMap[comment.post_id] || 0) + 1;
        });
      }

      // Get current user's liked posts if authenticated
      let userLikedPosts: string[] = [];
      if (req.userId) {
        try {
          const profile = await getProfileByClerkId(req.userId);
          if (profile) {
            const { data: userLikes } = await supabase
              .from('post_likes')
              .select('post_id')
              .eq('profile_id', profile.id)
              .in('post_id', postIds);

            userLikedPosts = (userLikes || []).map((like: any) => like.post_id);
          }
        } catch (profileError) {
          console.warn('[postController] Could not fetch user profile for likes:', profileError);
        }
      }

      // Format posts with author profile, counts, and images
      const postsWithAuthor = posts.map((post: any) => {
        const author = post.author || {};
        // Extract and sort images by display_order
        const postImages = (post.post_images || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((img: any) => img.image_url);
        
        return {
          id: post.id,
          content: post.content,
          images: postImages,
          author: author.full_name || 'Unknown',
          authorCompany: author.username ? `@${author.username}` : '',
          authorId: author.id || null,
          authorProfile: author.id
            ? {
                id: author.id,
                name: author.full_name,
                username: author.username,
                avatar: author.avatar_url,
              }
            : null,
          timestamp: formatTimestamp(post.created_at),
          likes: likesCountMap[post.id] || 0,
          comments: commentsCountMap[post.id] || 0,
          isLiked: userLikedPosts.includes(post.id),
          entity_id: post.entity_id,
          created_at: post.created_at,
        };
      });

      return res.json({
        posts: postsWithAuthor,
        total: postsWithAuthor.length,
      });
    } catch (error: any) {
      console.error('[postController] Error listing posts:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch posts' });
    }
  },

  // Create a new post
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = createPostSchema.parse(req.body);

      // Get or create profile
      let profile = await getProfileByClerkId(req.userId);
      if (!profile) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            clerk_user_id: req.userId,
          })
          .select()
          .single();

        if (profileError) {
          console.error('[postController] Error creating profile:', profileError);
          return res.status(500).json({ error: `Failed to create profile: ${profileError.message}` });
        }

        profile = newProfile;
      }

      // Validate that post has either content or images
      if (!validatedData.content && (!validatedData.image_urls || validatedData.image_urls.length === 0)) {
        return res.status(400).json({ error: 'Post must have content or at least one image' });
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: profile.id,
          content: validatedData.content || '',
          entity_id: validatedData.entity_id || null,
        })
        .select()
        .single();

      if (postError || !post) {
        console.error('[postController] Error creating post:', postError);
        return res.status(400).json({ error: postError?.message || 'Failed to create post' });
      }

      // Save image URLs to post_images table if provided
      if (validatedData.image_urls && validatedData.image_urls.length > 0) {
        const postImages = validatedData.image_urls.map((url, index) => ({
          post_id: post.id,
          image_url: url,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from('post_images')
          .insert(postImages);

        if (imagesError) {
          console.error('[postController] Error saving post images:', imagesError);
          // Continue even if image save fails - post is already created
        }
      }

      // Fetch author profile
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', profile.id)
        .single();

      return res.status(201).json({
        id: post.id,
        content: post.content,
        author: authorProfile?.full_name || 'Unknown',
        authorCompany: authorProfile?.username ? `@${authorProfile.username}` : '',
        authorId: authorProfile?.id || null,
        authorProfile: authorProfile
          ? {
              id: authorProfile.id,
              name: authorProfile.full_name,
              username: authorProfile.username,
              avatar: authorProfile.avatar_url,
            }
          : null,
        timestamp: formatTimestamp(post.created_at),
        likes: 0,
        comments: 0,
        isLiked: false,
        entity_id: post.entity_id,
        created_at: post.created_at,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('[postController] Error creating post:', error);
      return res.status(500).json({ error: error.message || 'Failed to create post' });
    }
  },

  // Get likes for a post
  getLikes: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Post ID is required' });
      }

      // Fetch likes with user profiles
      const { data: likes, error } = await supabase
        .from('post_likes')
        .select(
          `
          id,
          profile_id,
          created_at,
          profile:profiles!post_likes_profile_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          )
        `
        )
        .eq('post_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[postController] Error fetching likes:', error);
        return res.status(400).json({ error: error.message });
      }

      const formattedLikes = (likes || []).map((like: any) => ({
        id: like.id,
        user_id: like.profile_id,
        profile: like.profile
          ? {
              id: like.profile.id,
              full_name: like.profile.full_name,
              username: like.profile.username,
              avatar_url: like.profile.avatar_url,
            }
          : null,
        created_at: like.created_at,
      }));

      return res.json({ likes: formattedLikes });
    } catch (error: any) {
      console.error('[postController] Error fetching likes:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch likes' });
    }
  },

  // Get comments for a post
  getComments: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Post ID is required' });
      }

      // Fetch comments with user profiles (only top-level comments for now)
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select(
          `
          id,
          author_id,
          content,
          created_at,
          profile:profiles!post_comments_author_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          )
        `
        )
        .eq('post_id', id)
        .is('parent_comment_id', null) // Only top-level comments
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[postController] Error fetching comments:', error);
        return res.status(400).json({ error: error.message });
      }

      const formattedComments = (comments || []).map((comment: any) => ({
        id: comment.id,
        user_id: comment.author_id,
        content: comment.content,
        profile: comment.profile
          ? {
              id: comment.profile.id,
              full_name: comment.profile.full_name,
              username: comment.profile.username,
              avatar_url: comment.profile.avatar_url,
            }
          : null,
        created_at: comment.created_at,
      }));

      return res.json({ comments: formattedComments });
    } catch (error: any) {
      console.error('[postController] Error fetching comments:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch comments' });
    }
  },

  // Create a comment
  createComment: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { content, parent_comment_id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Post ID is required' });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      // Get or create profile
      let profile = await getProfileByClerkId(req.userId);
      if (!profile) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            clerk_user_id: req.userId,
          })
          .select()
          .single();

        if (profileError) {
          console.error('[postController] Error creating profile:', profileError);
          return res.status(500).json({ error: `Failed to create profile: ${profileError.message}` });
        }

        profile = newProfile;
      }

      // Create comment
      const { data: comment, error: commentError } = await supabase
        .from('post_comments')
        .insert({
          post_id: id,
          author_id: profile.id,
          content: content.trim(),
          parent_comment_id: parent_comment_id || null,
        })
        .select()
        .single();

      if (commentError || !comment) {
        console.error('[postController] Error creating comment:', commentError);
        return res.status(400).json({ error: commentError?.message || 'Failed to create comment' });
      }

      // Fetch comment with profile
      const { data: commentWithProfile } = await supabase
        .from('post_comments')
        .select(
          `
          *,
          profile:profiles!post_comments_author_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          )
        `
        )
        .eq('id', comment.id)
        .single();

      const formattedComment = {
        id: commentWithProfile.id,
        user_id: commentWithProfile.author_id,
        content: commentWithProfile.content,
        profile: commentWithProfile.profile
          ? {
              id: commentWithProfile.profile.id,
              full_name: commentWithProfile.profile.full_name,
              username: commentWithProfile.profile.username,
              avatar_url: commentWithProfile.profile.avatar_url,
            }
          : null,
        created_at: commentWithProfile.created_at,
      };

      return res.status(201).json(formattedComment);
    } catch (error: any) {
      console.error('[postController] Error creating comment:', error);
      return res.status(500).json({ error: error.message || 'Failed to create comment' });
    }
  },

  // Like or unlike a post
  toggleLike: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Post ID is required' });
      }

      // Get or create profile
      let profile = await getProfileByClerkId(req.userId);
      if (!profile) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            clerk_user_id: req.userId,
          })
          .select()
          .single();

        if (profileError) {
          console.error('[postController] Error creating profile:', profileError);
          return res.status(500).json({ error: `Failed to create profile: ${profileError.message}` });
        }

        profile = newProfile;
      }

      // Check if like already exists
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', id)
        .eq('profile_id', profile.id)
        .single();

      if (existingLike) {
        // Unlike: delete the like
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) {
          console.error('[postController] Error removing like:', deleteError);
          return res.status(400).json({ error: deleteError.message });
        }

        return res.json({ liked: false });
      } else {
        // Like: create the like
        const { data: newLike, error: likeError } = await supabase
          .from('post_likes')
          .insert({
            post_id: id,
            profile_id: profile.id,
          })
          .select()
          .single();

        if (likeError || !newLike) {
          console.error('[postController] Error creating like:', likeError);
          return res.status(400).json({ error: likeError?.message || 'Failed to like post' });
        }

        return res.json({ liked: true });
      }
    } catch (error: any) {
      console.error('[postController] Error toggling like:', error);
      return res.status(500).json({ error: error.message || 'Failed to toggle like' });
    }
  },
};

// Helper function to format timestamp
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

