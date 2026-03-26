import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export interface AuthRequest extends Request {
  user?: any;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Auth service timeout')), ms)
    ),
  ]);
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });

  try {
    const { data: { user }, error } = await withTimeout(supabase.auth.getUser(token), 5000);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
  } catch (err: any) {
    if (err.message === 'Auth service timeout') {
      return res.status(503).json({ error: 'Auth service temporarily unavailable' });
    }
    return res.status(500).json({ error: 'Auth validation failed' });
  }
};
