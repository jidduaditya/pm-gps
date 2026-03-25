import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';
import { startQuiz, submitQuiz } from '../services/quizService';

export const quizController = {
  start: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pm_role_id } = req.body;
    if (!pm_role_id) {
      throw new AppError('pm_role_id is required', 400, 'VALIDATION_ERROR');
    }

    const result = await startQuiz(req.user!.id, pm_role_id);
    res.status(201).json(result);
  }),

  submit: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { quiz_id } = req.params;
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      throw new AppError('answers object is required and must not be empty', 400, 'VALIDATION_ERROR');
    }

    // Validate each answer is A/B/C/D
    for (const [questionId, answer] of Object.entries(answers)) {
      if (typeof answer !== 'string' || !['A', 'B', 'C', 'D'].includes((answer as string).toUpperCase().trim())) {
        throw new AppError(`Invalid answer for question ${questionId}: must be A, B, C, or D`, 400, 'VALIDATION_ERROR');
      }
    }

    const result = await submitQuiz(quiz_id, req.user!.id, answers as Record<string, string>);
    res.status(200).json(result);
  }),
};
