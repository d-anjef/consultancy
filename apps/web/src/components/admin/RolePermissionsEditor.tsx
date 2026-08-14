'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Trash2, ShieldCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { PermissionCheckboxGroup } from './PermissionCheckboxGroup';
import { useUpdateRole, useDeleteRole } from '@/hooks/useRoles';
import { usePermissionsGrouped } from '@/hooks/usePermissionsList';
import type { RoleDetail } from '@/lib/api/roles';

interface RolePermissionsEditorProps {
  role: RoleDetail;
}

export function RolePermissionsEditor({ role }: RolePermissionsEditorProps) {
  const { data: grouped = {}, isLoading } = usePermissionsGrouped();
  const update = useUpdateRole(role.id);
  const deleteRole = useDeleteRole();

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCodes(new Set(role.permissions));
    setError(null);
  }, [role.id, role.permissions]);

  const originalCodes = useMemo(() => new Set(role.permissions), [role.permissions]);
  const isDirty =
    selectedCodes.size !== originalCodes.size ||
    Array.from(selectedCodes).some((c) => !originalCodes.has(c));

  const isSuperAdmin = role.code === 'SUPER_ADMIN';
  const isReadOnly = isSuperAdmin;

  function togglePermission(code: string) {
    if (isReadOnly) return;
    const next = new Set(selectedCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelectedCodes(next);
  }

  function selectAll(codes: string[]) {
    if (isReadOnly) return;
    const next = new Set(selectedCodes);
    codes.forEach((c) => next.add(c));
    setSelectedCodes(next);
  }

  function deselectAll(codes: string[]) {
    if (isReadOnly) return;
    const next = new Set(selectedCodes);
    codes.forEach((c) => next.delete(c));
    setSelectedCodes(next);
  }

  async function handleSave() {
    setError(null);
    if (selectedCodes.size === 0) {
      setError('Role must have at least one permission');
      return;
    }
    try {
      await update.mutateAsync({
        permissions: Array.from(selectedCodes),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  function handleReset() {
    setSelectedCodes(new Set(role.permissions));
    setError(null);
  }

  async function handleDelete() {
    if (role.isSystem) return;
    if (
      !confirm(
        `Delete role "${role.displayName}"? Users with this role must be reassigned first.`,
      )
    )
      return;
    await deleteRole.mutateAsync(role.id);
  }

  if (isLoading) return <LoadingState message="Loading permissions…" />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                {role.displayName}
                {role.isSystem && <Badge variant="secondary">System Role</Badge>}
              </CardTitle>
              <p className="mt-1 text-xs font-mono text-muted-foreground">
                {role.code}
              </p>
              {role.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {role.description}
                </p>
              )}
            </div>
            {!role.isSystem && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                isLoading={deleteRole.isPending}
                className="text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {isSuperAdmin && (
        <Card className="border-accent/30 bg-accent-light">
          <CardContent className="p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              Super Admin permissions cannot be modified. This role always has all permissions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {selectedCodes.size}
          </span>{' '}
          permission{selectedCodes.size === 1 ? '' : 's'} selected
        </p>
        {!isReadOnly && (
          <div className="flex gap-2">
            {isDirty && (
              <>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleSave}
                  isLoading={update.isPending}
                  loadingText="Saving…"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Permission Groups */}
      <div className="space-y-3">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, perms]) => (
            <PermissionCheckboxGroup
              key={category}
              category={category}
              permissions={perms}
              selectedCodes={selectedCodes}
              onToggle={togglePermission}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              disabled={isReadOnly}
            />
          ))}
      </div>
    </div>
  );
}