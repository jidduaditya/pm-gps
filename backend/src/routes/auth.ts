import { Router } from 'express';
import { authController } from '../controllers/authController';

export const authRoutes = Router();

authRoutes.post('/login', authController.googleLogin);
authRoutes.get('/callback', authController.googleCallback);
authRoutes.post('/otp/send', authController.sendOtp);
authRoutes.post('/otp/verify', authController.verifyOtp);
