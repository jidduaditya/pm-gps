import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

export const profileRoutes = Router();

profileRoutes.use(authenticate);
profileRoutes.get('/prefill/:session_id', profileController.getPrefill);
