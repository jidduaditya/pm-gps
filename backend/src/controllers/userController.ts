import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

export const userController = {
  deleteData: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    // Get all sessions for this user to find all documents
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*, documents(*)')
      .eq('user_id', userId);
    if (sessionsError) throw new AppError(sessionsError.message, 500, 'DB_ERROR');

    // Delete files from Supabase Storage
    const storageUrls = (sessions ?? [])
      .flatMap((s: any) => s.documents ?? [])
      .map((d: any) => d.storage_url)
      .filter((url: string | null): url is string => !!url);

    if (storageUrls.length > 0) {
      const fileNames = storageUrls.map((url: string) => url.split('/').pop()!);
      await supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || 'documents')
        .remove(fileNames);
    }

    // Delete all session-related data (cascade handles documents, questionnaires, profiles, results)
    const { error: deleteSessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);
    if (deleteSessionsError) throw new AppError(deleteSessionsError.message, 500, 'DB_ERROR');

    // Anonymise user record
    const { error: updateError } = await supabase
      .from('users')
      .update({ email: null, phone: null })
      .eq('id', userId);
    if (updateError) throw new AppError(updateError.message, 500, 'DB_ERROR');

    res.json({ message: 'All data deleted successfully' });
  }),
};
