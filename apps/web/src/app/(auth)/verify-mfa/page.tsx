'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/types/api.types';
import { mfaFormSchema, type MfaFormValues } from '@/lib/validators/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/data/constants';

function VerifyMfaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyMfa } = useAuth();
  const token = searchParams.get('token') ?? '';

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MfaFormValues>({
    resolver: zodResolver(mfaFormSchema),
  });

  const onSubmit = async (values: MfaFormValues) => {
    setFormError(null);
    if (!token) {
      setFormError('Session expired. Please log in again.');
      return;
    }

    try {
      const user = await verifyMfa(token, values.code);
      const target =
        user.role.code === 'STUDENT' ? ROUTES.MY_DASHBOARD : ROUTES.DASHBOARD;
      router.push(target);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Verification failed. Please try again.',
      );
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          No verification session found.
        </p>
        <Button asChild variant="outline">
          <a href={ROUTES.LOGIN}>Return to sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
            <ShieldCheck className="h-6 w-6 text-accent-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Two-factor authentication
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app or email.
          </p>
        </div>
      </div>

      {formError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono"
            error={!!errors.code}
            {...register('code')}
          />
          {errors.code && (
            <p className="text-xs text-destructive">{errors.code.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          loadingText="Verifying…"
        >
          Verify
        </Button>
      </form>
    </div>
  );
}

export default function VerifyMfaPage() {
  return (
    <Suspense fallback={null}>
      <VerifyMfaContent />
    </Suspense>
  );
}