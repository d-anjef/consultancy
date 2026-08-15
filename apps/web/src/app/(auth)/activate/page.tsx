'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, KeyRound, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api/endpoints/auth.api';
import { ApiError } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/data/constants';

const schema = z
  .object({
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .max(128)
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Must contain at least 1 number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least 1 special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'success'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) return;
    setFormError(null);

    try {
      await authApi.activateAccount(token, values.password);
      setStatus('success');
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 2500);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError(
          'Failed to activate account. The link may be expired or invalid.',
        );
      }
    }
  };

  // Missing token
  if (!token) {
    return (
      <div className="space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Invalid Activation Link
          </h1>
          <p className="text-sm text-muted-foreground">
            The activation link is missing a token. Please check your email and
            click the link again, or contact your administrator.
          </p>
        </div>
        <Link href={ROUTES.LOGIN} className="block">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Account Activated!
          </h1>
          <p className="text-sm text-muted-foreground">
            Your password has been set successfully. Redirecting to login…
          </p>
        </div>
        <Link href={ROUTES.LOGIN} className="block">
          <Button variant="accent" className="w-full">
            Go to Login Now
          </Button>
        </Link>
      </div>
    );
  }

  // Form
  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
        <KeyRound className="h-6 w-6 text-accent-foreground" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Activate Your Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Set a password to complete your registration
        </p>
      </div>

      {formError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Type it again"
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Password requirements:</p>
<ul className="list-disc list-inside space-y-0.5">
   <li>At least 10 characters</li>
  <li>1 uppercase letter (A-Z)</li>
  <li>1 lowercase letter (a-z)</li>
  <li>1 number (0-9)</li>
  <li>1 special character (!@#$...)</li>
  </ul>
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          loadingText="Activating…"
        >
          Activate Account
        </Button>

        <p className="text-center">
          <Link
            href={ROUTES.LOGIN}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Already activated? Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={null}>
      <ActivateContent />
    </Suspense>
  );
}