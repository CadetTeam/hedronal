import { Response } from 'express';
import { supabase, getProfileByClerkId } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import { z } from 'zod';

const createArticleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
  topic: z.string().min(1),
  author: z.string().min(1),
  date: z.string().optional(), // ISO date string
  read_time: z.string().optional(), // e.g., '5 min'
});

export const articleController = {
  // Get all articles with likes count
  list: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { topic, limit, offset } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const offsetNum = offset ? parseInt(offset as string, 10) : 0;

      let query = supabase
        .from('articles')
        .select(`
          *,
          article_likes(count)
        `)
        .order('date', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);

      if (topic) {
        query = query.eq('topic', topic);
      }

      const { data: articles, error } = await query;

      if (error) {
        console.error('[articleController] Error fetching articles:', error);
        return res.status(400).json({ error: error.message });
      }

      // Transform the data to include likes count
      const articlesWithLikes = (articles || []).map((article: any) => ({
        ...article,
        likes_count: article.article_likes?.[0]?.count || 0,
        article_likes: undefined, // Remove the nested data
      }));

      // Get current user's liked articles if authenticated
      let userLikedArticles: string[] = [];
      if (req.userId) {
        try {
          const profile = await getProfileByClerkId(req.userId);
          if (profile) {
            const { data: likes } = await supabase
              .from('article_likes')
              .select('article_id')
              .eq('profile_id', profile.id);

            userLikedArticles = (likes || []).map((like: any) => like.article_id);
          }
        } catch (profileError) {
          console.warn('[articleController] Could not fetch user profile for likes:', profileError);
        }
      }

      // Add isLiked flag to each article
      const articlesWithLikeStatus = articlesWithLikes.map((article: any) => ({
        ...article,
        isLiked: userLikedArticles.includes(article.id),
      }));

      return res.json({
        articles: articlesWithLikeStatus,
        total: articlesWithLikeStatus.length,
      });
    } catch (error: any) {
      console.error('[articleController] Error listing articles:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch articles' });
    }
  },

  // Get a single article by ID
  getById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data: article, error } = await supabase
        .from('articles')
        .select(`
          *,
          article_likes(count)
        `)
        .eq('id', id)
        .single();

      if (error || !article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // Get like count
      const likesCount = article.article_likes?.[0]?.count || 0;

      // Check if current user liked it
      let isLiked = false;
      if (req.userId) {
        try {
          const profile = await getProfileByClerkId(req.userId);
          if (profile) {
            const { data: like } = await supabase
              .from('article_likes')
              .select('id')
              .eq('article_id', id)
              .eq('profile_id', profile.id)
              .single();

            isLiked = !!like;
          }
        } catch (profileError) {
          console.warn('[articleController] Could not fetch user profile for likes:', profileError);
        }
      }

      return res.json({
        ...article,
        likes_count: likesCount,
        isLiked,
        article_likes: undefined,
      });
    } catch (error: any) {
      console.error('[articleController] Error fetching article:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch article' });
    }
  },

  // Create a new article
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = createArticleSchema.parse(req.body);

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
          console.error('[articleController] Error creating profile:', profileError);
          return res.status(500).json({ error: `Failed to create profile: ${profileError.message}` });
        }

        profile = newProfile;
      }

      // Generate ID if not provided (use timestamp-based ID for new articles)
      const articleId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create article
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .insert({
          id: articleId,
          title: validatedData.title,
          description: validatedData.description,
          content: validatedData.content,
          topic: validatedData.topic,
          author: validatedData.author,
          date: validatedData.date || new Date().toISOString().split('T')[0],
          read_time: validatedData.read_time || '5 min',
          created_by: profile.id,
        })
        .select()
        .single();

      if (articleError || !article) {
        console.error('[articleController] Error creating article:', articleError);
        return res.status(400).json({ error: articleError?.message || 'Failed to create article' });
      }

      return res.status(201).json({
        ...article,
        likes_count: 0,
        isLiked: false,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.errors[0].message,
          details: error.errors,
        });
      }
      console.error('[articleController] Error creating article:', error);
      return res.status(500).json({ error: error.message || 'Failed to create article' });
    }
  },

  // Toggle like on an article
  toggleLike: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

      // Get profile
      const profile = await getProfileByClerkId(req.userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check if article exists
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select('id')
        .eq('id', id)
        .single();

      if (articleError || !article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // Check if like exists
      const { data: existingLike } = await supabase
        .from('article_likes')
        .select('id')
        .eq('article_id', id)
        .eq('profile_id', profile.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('article_likes')
          .delete()
          .eq('article_id', id)
          .eq('profile_id', profile.id);

        if (deleteError) {
          console.error('[articleController] Error unliking article:', deleteError);
          return res.status(400).json({ error: deleteError.message });
        }

        // Get updated like count
        const { count } = await supabase
          .from('article_likes')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', id);

        return res.json({ liked: false, likes_count: count || 0 });
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('article_likes')
          .insert({
            article_id: id,
            profile_id: profile.id,
          });

        if (insertError) {
          console.error('[articleController] Error liking article:', insertError);
          return res.status(400).json({ error: insertError.message });
        }

        // Get updated like count
        const { count } = await supabase
          .from('article_likes')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', id);

        return res.json({ liked: true, likes_count: count || 0 });
      }
    } catch (error: any) {
      console.error('[articleController] Error toggling like:', error);
      return res.status(500).json({ error: error.message || 'Failed to toggle like' });
    }
  },

  // Get all topics
  getTopics: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: topics, error } = await supabase
        .from('article_topics')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('[articleController] Error fetching topics:', error);
        return res.status(400).json({ error: error.message });
      }

      return res.json({ topics: topics || [] });
    } catch (error: any) {
      console.error('[articleController] Error fetching topics:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch topics' });
    }
  },
};
