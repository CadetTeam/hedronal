import { Router } from 'express';
import { postController } from '../controllers/postController';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';

export const postRouter = Router();

// Public route for listing posts (no auth required)
postRouter.get('/', postController.list);

// Protected route for creating posts
postRouter.post('/', clerkAuthMiddleware, postController.create);

// Public route for getting post likes (no auth required)
postRouter.get('/:id/likes', postController.getLikes);

// Public route for getting post comments (no auth required)
postRouter.get('/:id/comments', postController.getComments);

// Protected route for creating comments
postRouter.post('/:id/comments', clerkAuthMiddleware, postController.createComment);

// Protected route for liking/unliking posts
postRouter.post('/:id/like', clerkAuthMiddleware, postController.toggleLike);

// Protected route for updating posts
postRouter.patch('/:id', clerkAuthMiddleware, postController.update);

// Protected route for deleting posts
postRouter.delete('/:id', clerkAuthMiddleware, postController.delete);

