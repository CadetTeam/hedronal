import { Router } from 'express';
import { entityController } from '../controllers/entityController';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';

export const entityRouter = Router();

entityRouter.post('/', clerkAuthMiddleware, entityController.create);
entityRouter.get('/', clerkAuthMiddleware, entityController.list);
entityRouter.get('/archived', clerkAuthMiddleware, entityController.listArchived);
entityRouter.get('/:id', entityController.getById);
entityRouter.get('/clerk/:clerkOrgId', entityController.getByClerkOrgId);
entityRouter.patch('/:id', clerkAuthMiddleware, entityController.update);
entityRouter.post('/:id/archive', clerkAuthMiddleware, entityController.archive);
entityRouter.post('/:id/unarchive', clerkAuthMiddleware, entityController.unarchive);
entityRouter.delete('/:id', clerkAuthMiddleware, entityController.deletePermanently);

