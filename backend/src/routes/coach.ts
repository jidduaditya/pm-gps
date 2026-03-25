import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { coachController } from '../controllers/coachController';
import { authenticate } from '../middleware/auth';

// Audio upload — 10MB max, audio mimetypes only
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('audio/'));
  },
});

const sessionLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many coaching sessions. Try again tomorrow.' } },
});

const turnLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many coaching turns. Try again tomorrow.' } },
});

const transcribeLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many transcription requests. Try again tomorrow.' } },
});

export const coachRoutes = Router();
coachRoutes.use(authenticate);

coachRoutes.post('/session', sessionLimit, coachController.createSession);
coachRoutes.post('/session/:id/turn', turnLimit, coachController.turn);
coachRoutes.get('/session/:id', coachController.getSession);
coachRoutes.post('/session/:id/end', coachController.endSession);
coachRoutes.get('/history', coachController.history);
coachRoutes.post('/transcribe', transcribeLimit, audioUpload.single('audio'), coachController.transcribe);
