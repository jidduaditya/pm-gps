import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { documentController } from '../controllers/documentController';
import { authenticate } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const uploadLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many upload requests' } },
});

export const documentRoutes = Router();

documentRoutes.use(authenticate);
documentRoutes.post('/upload', uploadLimit, upload.array('files', 5), documentController.uploadFiles);
documentRoutes.post('/text', documentController.pasteText);
