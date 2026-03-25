import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { quizController } from '../controllers/quizController';
import { authenticate } from '../middleware/auth';

const startLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 5,
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many quiz starts. Try again tomorrow.' } },
});

const submitLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 10,
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many quiz submissions. Try again tomorrow.' } },
});

export const quizRoutes = Router();
quizRoutes.use(authenticate);
quizRoutes.post('/start', startLimit, quizController.start);
quizRoutes.post('/:quiz_id/submit', submitLimit, quizController.submit);
