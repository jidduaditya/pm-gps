import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

export const sessionController = {
  createSession: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;

    // Ensure user exists in public users table (auth moved to frontend client)
    const userData: Record<string, unknown> = {
      id: user.id,
      auth_provider: user.app_metadata?.provider ?? 'google',
      last_login: new Date().toISOString(),
    };
    if (user.email) userData.email = user.email;
    if (user.phone) userData.phone = user.phone;

    const { error: upsertError } = await supabase.from('users').upsert(
      userData,
      { onConflict: 'id', ignoreDuplicates: false }
    );
    if (upsertError) throw new AppError(`User sync failed: ${upsertError.message}`, 500, 'DB_ERROR');

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ user_id: user.id })
      .select()
      .single();
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.status(201).json({ session_id: session.id });
  }),
};
