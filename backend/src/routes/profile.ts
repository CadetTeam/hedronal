import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';

export const profileRouter = Router();

// All profile routes require authentication
profileRouter.use(clerkAuthMiddleware);

profileRouter.get('/me', profileController.getMe);
profileRouter.patch('/me', profileController.updateMe);
profileRouter.get('/:id', profileController.getById);

