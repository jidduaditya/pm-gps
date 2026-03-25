import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  createCoachSession,
  submitTurn,
  getCoachSession,
  endCoachSession,
  getCoachHistory,
  transcribeAudio,
} from '../services/coachService';

export const coachController = {
  createSession: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pm_role_id, mode, input_method } = req.body;
    if (!pm_role_id) throw new AppError('pm_role_id is required', 400, 'VALIDATION_ERROR');
    if (!mode) throw new AppError('mode is required', 400, 'VALIDATION_ERROR');

    const result = await createCoachSession(req.user!.id, pm_role_id, mode, input_method);
    res.status(201).json(result);
  }),

  turn: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      throw new AppError('content (string) is required', 400, 'VALIDATION_ERROR');
    }
    if (content.length < 50) {
      throw new AppError('content must be at least 50 characters', 400, 'VALIDATION_ERROR');
    }

    const result = await submitTurn(id, req.user!.id, content);
    res.status(200).json(result);
  }),

  getSession: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await getCoachSession(id, req.user!.id);
    res.status(200).json(result);
  }),

  endSession: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await endCoachSession(id, req.user!.id);
    res.status(200).json(result);
  }),

  history: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await getCoachHistory(req.user!.id);
    res.status(200).json(result);
  }),

  transcribe: asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = req.file;
    if (!file) throw new AppError('audio file is required', 400, 'VALIDATION_ERROR');

    const result = await transcribeAudio(file.buffer, file.mimetype);
    res.status(200).json(result);
  }),
};
