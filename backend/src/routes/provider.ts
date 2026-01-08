import { Router } from 'express';
import { providerController } from '../controllers/providerController';

export const providerRouter = Router();

providerRouter.get('/', providerController.getAll);
providerRouter.get('/category/:category', providerController.getByCategory);
