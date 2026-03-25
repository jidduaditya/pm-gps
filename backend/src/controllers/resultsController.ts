import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { supabase } from '../lib/supabase';
import { documentService } from '../services/documentService';
import { AppError } from '../utils/AppError';

export const resultsController = {
  getResults: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id } = req.params;

    await documentService.validateSessionOwnership(session_id, req.user!.id);

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single();
    if (sessionError || !session) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Session not found' } });

    if (session.status === 'in_progress') {
      return res.json({ status: 'processing' });
    }

    if (session.status === 'failed') {
      return res.json({ status: 'failed', message: 'Processing failed. Please try again.' });
    }

    const { data: result, error: resultError } = await supabase
      .from('results')
      .select('*')
      .eq('session_id', session_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
    if (resultError) throw new AppError(resultError.message, 500, 'DB_ERROR');

    res.json({ status: 'completed', result });
  }),
};
