import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { roadmapController } from '../controllers/roadmapController';
import { authenticate } from '../middleware/auth';

const generateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 5,
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many roadmap generations. Try again tomorrow.' } },
});

export const roadmapRoutes = Router();
roadmapRoutes.use(authenticate);
roadmapRoutes.post('/generate', generateLimit, roadmapController.generate);
roadmapRoutes.get('/:roadmap_id', roadmapController.get);
roadmapRoutes.patch('/:roadmap_id/stage', roadmapController.updateStage);
