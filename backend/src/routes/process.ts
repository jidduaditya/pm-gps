import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { processController } from '../controllers/processController';
import { authenticate } from '../middleware/auth';

const processLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many process requests. Try again in an hour.' } },
});

export const processRoutes = Router();
processRoutes.use(authenticate);
processRoutes.post('/', processLimit, processController.trigger);
