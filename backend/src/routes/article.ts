import { Router } from 'express';
import { articleController } from '../controllers/articleController';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';

export const articleRouter = Router();

// Public routes (no auth required for reading)
articleRouter.get('/', articleController.list);
articleRouter.get('/topics', articleController.getTopics);
articleRouter.get('/:id', articleController.getById);

// Protected routes (auth required)
articleRouter.post('/', clerkAuthMiddleware, articleController.create);
articleRouter.post('/:id/like', clerkAuthMiddleware, articleController.toggleLike);

