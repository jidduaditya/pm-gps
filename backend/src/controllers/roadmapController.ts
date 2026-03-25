import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';
import { generateRoadmap, getRoadmap, completeStage } from '../services/roadmapService';

export const roadmapController = {
  generate: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { quiz_session_id } = req.body;
    if (!quiz_session_id) {
      throw new AppError('quiz_session_id is required', 400, 'VALIDATION_ERROR');
    }

    const result = await generateRoadmap(req.user!.id, quiz_session_id);
    res.status(201).json(result);
  }),

  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roadmap_id } = req.params;
    const result = await getRoadmap(roadmap_id, req.user!.id);
    res.status(200).json(result);
  }),

  updateStage: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roadmap_id } = req.params;
    const { stage_number } = req.body;

    if (stage_number == null || typeof stage_number !== 'number') {
      throw new AppError('stage_number (number) is required', 400, 'VALIDATION_ERROR');
    }

    const result = await completeStage(roadmap_id, req.user!.id, stage_number);
    res.status(200).json(result);
  }),
};
