'use client';

import { useState } from 'react';
import { Plus, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

interface Branch {
  id: string;
  code: string;
  name: string;
  address: {
    street: string;
    city: string;
    district: string;
    province: string;
    country: string;
  };
  phone: string;
  email: string;
  timezone: string;
  isActive: boolean;
}

export default function BranchesPage() {
  const { has } = usePermissions();

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches', 'all'],
    queryFn: () => api.get<Branch[]>('/branches/active'),
    staleTime: 5 * 60_000,
  });

  const canCreate = has(PERMISSION_CODES.CREATE_BRANCH);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Branches</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organization branches
          </p>
        </div>
        {canCreate && (
          <Button variant="accent">
            <Plus className="h-4 w-4" />
            New Branch
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading branches…" />
      ) : branches.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title="No branches" description="No branches found." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{branch.name}</CardTitle>
                  <Badge variant={branch.isActive ? 'success' : 'muted'}>
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-muted-foreground">{branch.code}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {branch.address.street}, {branch.address.city}, {branch.address.district}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>{branch.email}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}