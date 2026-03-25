import { Router } from 'express';
import { sessionController } from '../controllers/sessionController';
import { authenticate } from '../middleware/auth';

export const sessionRoutes = Router();

sessionRoutes.use(authenticate);
sessionRoutes.post('/', sessionController.createSession);
