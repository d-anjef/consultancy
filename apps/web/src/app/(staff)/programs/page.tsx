'use client';

import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { usePrograms, useUpdateProgram } from '@/hooks/usePrograms';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { CreateProgramDialog } from '@/components/admin/CreateProgramDialog';
import type { Program } from '@/lib/api/programs';

const TYPE_LABELS: Record<string, string> = {
  LANGUAGE_SCHOOL: 'Language School',
  UNIVERSITY: 'University',
  VOCATIONAL: 'Vocational',
  WORKING: 'Working',
  OTHER: 'Other',
};

export default function ProgramsPage() {
  const { has } = usePermissions();
  const { data: programs = [], isLoading } = usePrograms();
  const [createOpen, setCreateOpen] = useState(false);

  const canManage = has(PERMISSION_CODES.MANAGE_PROGRAMS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Programs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage program types offered by the consultancy
          </p>
        </div>
        {canManage && (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Program
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading programs…" />
      ) : programs.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No programs yet"
            description={canManage ? 'Create your first program to get started.' : 'No programs available.'}
            action={
              canManage ? (
                <Button variant="accent" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Program
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} canManage={canManage} />
          ))}
        </div>
      )}

      <CreateProgramDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function ProgramCard({
  program,
  canManage,
}: {
  program: Program;
  canManage: boolean;
}) {
  const update = useUpdateProgram(program.id);

  async function toggleActive() {
    await update.mutateAsync({ isActive: !program.isActive });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{program.name}</CardTitle>
          <Badge variant={program.isActive ? 'success' : 'muted'}>
            {program.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          {program.code}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="secondary">{TYPE_LABELS[program.type] ?? program.type}</Badge>
          {program.durationMonths && (
            <span className="text-muted-foreground">
              {program.durationMonths} months
            </span>
          )}
        </div>
        {program.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {program.description}
          </p>
        )}
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={toggleActive}
            isLoading={update.isPending}
          >
            {program.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}