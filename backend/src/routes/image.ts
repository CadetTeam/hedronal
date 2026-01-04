import { Router } from 'express';
import { imageController } from '../controllers/imageController';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';

export const imageRouter = Router();

imageRouter.post('/upload', clerkAuthMiddleware, imageController.upload);
imageRouter.delete('/delete', clerkAuthMiddleware, imageController.delete);

