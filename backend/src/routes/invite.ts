import { Router } from 'express';
import { inviteController } from '../controllers/inviteController';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';

export const inviteRouter = Router();

// All invite routes require authentication
inviteRouter.use(clerkAuthMiddleware);

inviteRouter.post('/', inviteController.create);
inviteRouter.get('/', inviteController.list);

