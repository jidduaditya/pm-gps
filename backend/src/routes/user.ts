import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

export const userRoutes = Router();
userRoutes.use(authenticate);
userRoutes.delete('/data', userController.deleteData);
