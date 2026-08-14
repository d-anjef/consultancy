'use client';

import { useState } from 'react';
import { Plus, Users, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { api } from '@/lib/api/client';
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

interface User {
  id: string;
  email: string;
  role: { id: string; code: string; displayName: string };
  branch: { id: string; code: string; name: string } | null;
  profile: { firstName: string; lastName: string; phone: string };
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'muted' | 'destructive'> = {
  ACTIVE: 'success',
  PENDING_ACTIVATION: 'warning',
  INACTIVE: 'muted',
  SUSPENDED: 'destructive',
};

export default function UsersPage() {
  const { has } = usePermissions();
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', { search }],
    queryFn: () => api.get<User[]>('/users', { search: search || undefined, limit: 100 }),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff and student accounts
          </p>
        </div>
      </div>

      {/* Search */}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-secondary/50">
                  <TableCell className="font-medium">
                    {u.profile.firstName} {u.profile.lastName}
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}