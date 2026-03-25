import { Router } from 'express';
import { questionnaireController } from '../controllers/questionnaireController';
import { authenticate } from '../middleware/auth';

export const questionnaireRoutes = Router();
questionnaireRoutes.use(authenticate);
questionnaireRoutes.post('/', questionnaireController.submit);
