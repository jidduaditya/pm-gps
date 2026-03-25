import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type AsyncFn = (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFn) => (req: AuthRequest, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
