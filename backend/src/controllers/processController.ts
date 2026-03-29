import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { supabase } from '../lib/supabase';
import { documentService } from '../services/documentService';
import { AppError } from '../utils/AppError';
import { runExtractionJob } from '../services/extractionService';

export const processController = {
  trigger: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id } = req.body;
    if (!session_id) throw new AppError('session_id required', 400, 'MISSING_FIELD');

    await documentService.validateSessionOwnership(session_id, req.user!.id);

    const [{ count: docCount, error: docError }, { count: qCount, error: qError }] = await Promise.all([
      supabase.from('documents').select('*', { count: 'exact', head: true }).eq('session_id', session_id),
      supabase.from('questionnaire_responses').select('*', { count: 'exact', head: true }).eq('session_id', session_id),
    ]);

    if (docError) throw new AppError(docError.message, 500, 'DB_ERROR');
    if (qError) throw new AppError(qError.message, 500, 'DB_ERROR');

    if ((docCount ?? 0) === 0) throw new AppError('At least one document is required', 400, 'NO_DOCUMENTS');
    if ((qCount ?? 0) === 0) throw new AppError('Questionnaire must be completed', 400, 'NO_QUESTIONNAIRE');

    // Run extraction + recommendation inline (no Redis/BullMQ needed)
    await runExtractionJob(session_id);

    res.json({ message: 'Processing complete', session_id });
  }),
};
