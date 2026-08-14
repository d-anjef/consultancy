export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  requiresMfa: boolean;
  mfaMethod?: 'TOTP' | 'EMAIL_OTP' | 'SMS_OTP';
  mfaSessionToken?: string;
}

export interface MfaVerifyInput {
  mfaSessionToken: string;
  code: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ActivateAccountInput {
  token: string;
  password: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}