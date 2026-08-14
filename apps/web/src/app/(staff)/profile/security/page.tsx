'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Key, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api/client';
import { ApiError } from '@/types/api.types';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z
      .string()
      .min(10, 'Minimum 10 characters')
      .regex(/[A-Z]/, 'Need one uppercase letter')
      .regex(/[a-z]/, 'Need one lowercase letter')
      .regex(/[0-9]/, 'Need one number')
      .regex(/[^A-Za-z0-9]/, 'Need one special character'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different',
    path: ['newPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function SecurityPage() {
  const { user } = useAuth();
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', data),
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError(null);
      form.reset();
      setTimeout(() => setPasswordSuccess(false), 5000);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setPasswordError(err.message);
      } else {
        setPasswordError('Failed to change password');
      }
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password and security settings
        </p>
      </div>

      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Password</span>
            </div>
            <Badge variant="success">Set</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Two-Factor Authentication</span>
            </div>
            <Badge variant="muted">Not enabled</Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Email Verified</span>
            </div>
            <Badge variant="success">Verified</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <div className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Password changed successfully!
            </div>
          )}

          {passwordError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {passwordError}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                changePassword.mutate({
                  currentPassword: data.currentPassword,
                  newPassword: data.newPassword,
                })
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Current Password <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      New Password <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <p className="text-xxs text-muted-foreground mt-1">
                      Min 10 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Confirm New Password <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="accent"
                isLoading={changePassword.isPending}
                loadingText="Changing…"
              >
                <Key className="h-4 w-4" />
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* MFA Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add an extra layer of security to your account. When enabled, you'll need
            to enter a code from your authenticator app each time you sign in.
          </p>
          <Button variant="outline" disabled>
            <ShieldCheck className="h-4 w-4" />
            Set Up 2FA (Coming Soon)
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Info</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Logged in as</span>
            <span className="font-medium text-foreground">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium text-foreground">{user.role.displayName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}