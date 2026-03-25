import { Router } from 'express';
import { resultsController } from '../controllers/resultsController';
import { authenticate } from '../middleware/auth';

export const resultsRoutes = Router();
resultsRoutes.use(authenticate);
resultsRoutes.get('/:session_id', resultsController.getResults);
