'use client';

import { useState, useEffect } from 'react';
import { Plus, ShieldCheck, Lock } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { CreateRoleDialog } from '@/components/admin/CreateRoleDialog';
import { RolePermissionsEditor } from '@/components/admin/RolePermissionsEditor';
import { cn } from '@/lib/utils';

export default function RolesPage() {
  const { has } = usePermissions();
  const { data: roles = [], isLoading } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const canManage = has(PERMISSION_CODES.MANAGE_ROLES);

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0]!.id);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  if (isLoading) {
    return <LoadingState fullPage message="Loading roles…" />;
  }

  if (!canManage) {
    return (
      <EmptyState
        icon={Lock}
        title="Access Denied"
        description="You do not have permission to manage roles."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Roles & Permissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage roles and configure their permissions
          </p>
        </div>
        <Button variant="accent" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Custom Role
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left: Roles List */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              System Roles
            </h2>
            <div className="space-y-1">
              {systemRoles.map((role) => (
                <RoleListItem
                  key={role.id}
                  role={role}
                  isSelected={role.id === selectedRoleId}
                  onClick={() => setSelectedRoleId(role.id)}
                />
              ))}
            </div>
          </div>

          {customRoles.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custom Roles
              </h2>
              <div className="space-y-1">
                {customRoles.map((role) => (
                  <RoleListItem
                    key={role.id}
                    role={role}
                    isSelected={role.id === selectedRoleId}
                    onClick={() => setSelectedRoleId(role.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Permissions Editor */}
        <div className="lg:col-span-3">
          {selectedRole ? (
            <RolePermissionsEditor role={selectedRole} />
          ) : (
            <Card>
              <EmptyState
                icon={ShieldCheck}
                title="Select a role"
                description="Choose a role from the sidebar to view and edit its permissions."
              />
            </Card>
          )}
        </div>
      </div>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function RoleListItem({
  role,
  isSelected,
  onClick,
}: {
  role: { id: string; displayName: string; code: string; isSystem: boolean; permissions: string[] };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full text-left rounded-md border p-3 transition-colors',
        isSelected
          ? 'border-accent bg-accent-light/40'
          : 'border-border bg-card hover:bg-secondary/50',
      )}
    >
      {isSelected && (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {role.displayName}
          </p>
          <p className="text-xxs font-mono text-muted-foreground truncate">
            {role.code}
          </p>
        </div>
        {role.isSystem && (
          <Badge variant="secondary" className="shrink-0">
            System
          </Badge>
        )}
      </div>
      <p className="mt-2 text-xxs text-muted-foreground">
        {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
      </p>
    </button>
  );
}