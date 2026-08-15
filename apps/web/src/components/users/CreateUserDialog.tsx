'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateUser } from '@/hooks/useUsers';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api/client';

interface Branch {
  id: string;
  code: string;
  name: string;
}

interface Role {
  id: string;
  code: string;
  displayName: string;
  isSystem: boolean;
}

const ORG_WIDE_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const schema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().trim().min(1, 'Required').max(100),
  lastName: z.string().trim().min(1, 'Required').max(100),
  phone: z.string().regex(/^(\+977)?[0-9]{7,10}$/, 'Invalid phone'),
  roleCode: z.string().min(1, 'Role required'),
  branchId: z.string().optional(),
  sendInvitation: z.boolean().default(true),
});

type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const create = useCreateUser();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', 'active'],
    queryFn: () => api.get<Branch[]>('/branches'),
    staleTime: 5 * 60_000,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => api.get<Role[]>('/roles'),
    staleTime: 5 * 60_000,
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleCode: '',
      branchId: user?.branch?.id ?? '',
      sendInvitation: true,
    },
  });

  const selectedRoleCode = form.watch('roleCode');
  const isTargetOrgWide = ORG_WIDE_ROLES.includes(selectedRoleCode);
  const isActorOrgWide = user?.role.code === 'SUPER_ADMIN' || user?.role.code === 'ADMIN';

  async function onSubmit(v: Values) {
    try {
      await create.mutateAsync({
        email: v.email,
        roleCode: v.roleCode,
        branchId: isTargetOrgWide ? undefined : v.branchId || undefined,
        profile: {
          firstName: v.firstName,
          lastName: v.lastName,
          phone: v.phone,
        },
        sendInvitation: v.sendInvitation,
      });
      toast.success(
        v.sendInvitation
          ? 'User created — invitation email sent'
          : 'User created',
      );
      form.reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create user');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New User</DialogTitle>
          <DialogDescription>
            Create a new staff account. An invitation email will be sent for setup.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+9779841234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="roleCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles
                        .filter((r) => r.code !== 'SUPER_ADMIN' && r.code !== 'STUDENT')
                        .map((role) => (
                          <SelectItem key={role.id} value={role.code}>
                            {role.displayName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Branch (only for non-org-wide roles) */}
            {selectedRoleCode && !isTargetOrgWide && isActorOrgWide && (
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isTargetOrgWide && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Organization-wide role — no branch assignment needed
              </p>
            )}

            {/* Send Invitation */}
            <FormField
              control={form.control}
              name="sendInvitation"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer !mt-0">
                      Send invitation email
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                isLoading={create.isPending}
                loadingText="Creating…"
              >
                Create User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}