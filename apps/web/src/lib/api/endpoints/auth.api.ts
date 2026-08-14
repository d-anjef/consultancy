import { api } from '@/lib/api/client';
import type { AuthenticatedUser, LoginResponse, MfaVerifyResponse } from '@/types/user.types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  verifyMfa: (mfaSessionToken: string, code: string) =>
    api.post<MfaVerifyResponse>('/auth/mfa/verify', { mfaSessionToken, code }),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  me: () => api.get<AuthenticatedUser>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),

  activateAccount: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/activate', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),
};