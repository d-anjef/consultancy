'use client';

import { useState } from 'react';
import { Plus, Users, Search, Check, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  useUsers,
  useActivateUser,
  useDeactivateUser,
  useResendInvitation,
} from '@/hooks/useUsers';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'muted' | 'destructive'> = {
  ACTIVE: 'success',
  PENDING_ACTIVATION: 'warning',
  INACTIVE: 'muted',
  SUSPENDED: 'destructive',
};

export default function UsersPage() {
  const { hasAny, has } = usePermissions();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useUsers({ search: search || undefined, limit: 100 });
  const users = data?.items ?? [];

  const activate = useActivateUser();
  const deactivate = useDeactivateUser();
  const resend = useResendInvitation();

  const canCreate = hasAny(
    PERMISSION_CODES.CREATE_USER_ADMIN,
    PERMISSION_CODES.CREATE_USER_BRANCH_MANAGER,
    PERMISSION_CODES.CREATE_USER_COUNSELOR,
    PERMISSION_CODES.CREATE_USER_RECEPTIONIST,
    PERMISSION_CODES.CREATE_USER_TEACHER,
  );
  const canEdit = has(PERMISSION_CODES.EDIT_USER);
  const canDeactivate = has(PERMISSION_CODES.DEACTIVATE_USER);

  async function handleActivate(id: string, name: string) {
    try {
      await activate.mutateAsync(id);
      toast.success(`${name} activated`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to activate');
    }
  }

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate ${name}?`)) return;
    try {
      await deactivate.mutateAsync(id);
      toast.success(`${name} deactivated`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to deactivate');
    }
  }

  async function handleResend(id: string, email: string) {
    try {
      await resend.mutateAsync(id);
      toast.success(`Invitation resent to ${email}`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to resend');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff and student accounts
          </p>
        </div>
        {canCreate && (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New User
          </Button>
        )}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {isLoading ? (
        <LoadingState message="Loading users…" />
      ) : users.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No users found" />
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const fullName = `${u.profile.firstName} ${u.profile.lastName}`;
                return (
                  <TableRow key={u.id} className="hover:bg-secondary/50">
                    <TableCell className="font-medium">{fullName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xxs">
                        {u.role.displayName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.branch?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[u.status] ?? 'muted'}>
                        {u.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {u.status === 'PENDING_ACTIVATION' && canEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivate(u.id, fullName)}
                              disabled={activate.isPending}
                              title="Activate now (skip email)"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Activate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(u.id, u.email)}
                              disabled={resend.isPending}
                              title="Resend invitation email"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {u.status === 'ACTIVE' && canDeactivate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(u.id, fullName)}
                            disabled={deactivate.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                            Deactivate
                          </Button>
                        )}
                        {u.status === 'INACTIVE' && canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(u.id, fullName)}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}