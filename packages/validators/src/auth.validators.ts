import { z } from 'zod';
import { emailSchema, passwordSchema } from './common.validators.js';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
  rememberMe: z.boolean().optional().default(false),
});

export const mfaVerifySchema = z.object({
  mfaSessionToken: z.string().min(1),
  code: z.string().trim().regex(/^[0-9]{6}$/, 'Code must be 6 digits'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const activateAccountSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const mfaSetupVerifySchema = z.object({
  code: z.string().trim().regex(/^[0-9]{6}$/, 'Code must be 6 digits'),
});

export const disableMfaSchema = z.object({
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type MfaVerifyDto = z.infer<typeof mfaVerifySchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ActivateAccountDto = z.infer<typeof activateAccountSchema>;