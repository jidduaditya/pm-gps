import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

export const authService = {
  getGoogleOAuthUrl: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: process.env.GOOGLE_REDIRECT_URL },
    });
    if (error) throw new AppError(error.message, 400, 'OAUTH_ERROR');
    return data.url;
  },

  handleGoogleCallback: async (code: string) => {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) throw new AppError('OAuth failed', 400, 'OAUTH_FAILED');

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(
        { id: data.user.id, email: data.user.email, auth_provider: 'google', last_login: new Date().toISOString() },
        { onConflict: 'email' }
      );
    if (upsertError) throw new AppError(upsertError.message, 500, 'DB_ERROR');

    return data.session.access_token;
  },

  sendOtp: async ({ email, phone }: { email?: string; phone?: string }) => {
    if (!email && !phone) throw new AppError('Email or phone required', 400, 'MISSING_FIELD');

    const { error } = email
      ? await supabase.auth.signInWithOtp({ email })
      : await supabase.auth.signInWithOtp({ phone: phone! });

    if (error) throw new AppError(error.message, 400, 'OTP_SEND_FAILED');
  },

  verifyOtp: async ({ email, phone, token }: { email?: string; phone?: string; token: string }) => {
    if (!email && !phone) throw new AppError('Email or phone required', 400, 'MISSING_FIELD');

    const { data, error } = email
      ? await supabase.auth.verifyOtp({ email, token, type: 'email' })
      : await supabase.auth.verifyOtp({ phone: phone!, token, type: 'sms' });

    if (error || !data.user) throw new AppError('Invalid OTP', 400, 'OTP_INVALID');

    const upsertData: Record<string, any> = {
      id: data.user.id,
      auth_provider: 'otp',
      last_login: new Date().toISOString(),
    };
    if (email) upsertData.email = email;
    if (phone) upsertData.phone = phone;

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(upsertData, { onConflict: email ? 'email' : 'phone' });
    if (upsertError) throw new AppError(upsertError.message, 500, 'DB_ERROR');

    return data.session!.access_token;
  },
};
