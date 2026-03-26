import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { sessionRoutes } from './routes/session';
import { documentRoutes } from './routes/document';
import { questionnaireRoutes } from './routes/questionnaire';
import { processRoutes } from './routes/process';
import { resultsRoutes } from './routes/results';
import { userRoutes } from './routes/user';
import { profileRoutes } from './routes/profile';
import { quizRoutes } from './routes/quiz';
import { roadmapRoutes } from './routes/roadmap';
import { coachRoutes } from './routes/coach';

export const app = express();

app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:8080')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/process', processRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/coach', coachRoutes);

app.use(errorHandler);
