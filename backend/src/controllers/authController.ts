import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export const authController = {
  googleLogin: asyncHandler(async (req: AuthRequest, res: Response) => {
    const url = await authService.getGoogleOAuthUrl();
    res.json({ url });
  }),

  googleCallback: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code } = req.query as { code: string };
    const token = await authService.handleGoogleCallback(code);
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) throw new Error('FRONTEND_URL env var is not set');
    res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  }),

  sendOtp: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, phone } = req.body;
    await authService.sendOtp({ email, phone });
    res.json({ message: 'OTP sent successfully' });
  }),

  verifyOtp: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, phone, token: otpToken } = req.body;
    const jwt = await authService.verifyOtp({ email, phone, token: otpToken });
    res.json({ token: jwt });
  }),
};
