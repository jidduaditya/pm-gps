import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { supabase } from '../lib/supabase';
import { documentService } from '../services/documentService';
import { AppError } from '../utils/AppError';

export const questionnaireController = {
  submit: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id, responses } = req.body;
    if (!session_id || !responses) throw new AppError('session_id and responses required', 400, 'MISSING_FIELD');

    await documentService.validateSessionOwnership(session_id, req.user!.id);

    // Delete any previous response for this session (handles retries)
    await supabase
      .from('questionnaire_responses')
      .delete()
      .eq('session_id', session_id);

    const { error } = await supabase
      .from('questionnaire_responses')
      .insert({ session_id, responses });
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    res.json({ message: 'Questionnaire submitted successfully' });
  }),
};
