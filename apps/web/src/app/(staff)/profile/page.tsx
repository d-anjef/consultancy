'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Building2, ShieldCheck, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(100),
  lastName: z.string().trim().min(1, 'Required').max(100),
  phone: z.string().trim().min(7).max(20),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [success, setSuccess] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.profile.firstName ?? '',
      lastName: user?.profile.lastName ?? '',
      phone: user?.profile.phone ?? '',
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      api.patch('/users/me/profile', data),
    onSuccess: async () => {
      setSuccess(true);
      await refresh();
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account information
        </p>
      </div>

      {/* Account Info (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Email
              </p>
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {user.email}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Role
              </p>
              <Badge variant="secondary">{user.role.displayName}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Branch
              </p>
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {user.branch?.name ?? 'Organization-wide'}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Permissions
              </p>
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                {user.role.permissions.length} active
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
              Profile updated successfully!
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => updateProfile.mutate(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="accent"
                isLoading={updateProfile.isPending}
                loadingText="Saving…"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}