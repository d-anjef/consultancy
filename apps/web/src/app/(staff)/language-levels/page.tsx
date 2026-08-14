'use client';

import { useState } from 'react';
import { Plus, Languages, Edit, Trash2 } from 'lucide-react';
import {
  useLanguageLevels,
  useUpdateLanguageLevel,
  useDeleteLanguageLevel,
} from '@/hooks/useLanguageLevels';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { CreateLanguageLevelDialog } from '@/components/admin/CreateLanguageLevelDialog';
import { EditLanguageLevelDialog } from '@/components/admin/EditLanguageLevelDialog';
import type { LanguageLevel } from '@/lib/api/language-levels';
import { formatNPR } from '@/lib/utils/currency';

export default function LanguageLevelsPage() {
  const { has } = usePermissions();
  const { data: levels = [], isLoading } = useLanguageLevels(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editLevel, setEditLevel] = useState<LanguageLevel | null>(null);

  const canManage = has(PERMISSION_CODES.MANAGE_SETTINGS);

  // Group by exam type
  const grouped = levels.reduce(
    (acc, level) => {
      const key = level.examType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(level);
      return acc;
    },
    {} as Record<string, LanguageLevel[]>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Language Levels
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage Japanese language proficiency levels (JLPT, NAT, custom)
          </p>
        </div>
        {canManage && (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Level
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading language levels…" />
      ) : levels.length === 0 ? (
        <Card>
          <EmptyState
            icon={Languages}
            title="No language levels yet"
            description={
              canManage
                ? 'Create your first language level to get started.'
                : 'No language levels available.'
            }
            action={
              canManage ? (
                <Button variant="accent" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Level
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([examType, examLevels]) => (
            <div key={examType}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {examType}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {examLevels.map((level) => (
                  <LevelCard
                    key={level.id}
                    level={level}
                    canManage={canManage}
                    onEdit={() => setEditLevel(level)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateLanguageLevelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <EditLanguageLevelDialog
        level={editLevel}
        open={!!editLevel}
        onOpenChange={(open) => !open && setEditLevel(null)}
      />
    </div>
  );
}

function LevelCard({
  level,
  canManage,
  onEdit,
}: {
  level: LanguageLevel;
  canManage: boolean;
  onEdit: () => void;
}) {
  const update = useUpdateLanguageLevel(level.id);
  const deleteLevel = useDeleteLanguageLevel();

  async function toggleActive() {
    await update.mutateAsync({ isActive: !level.isActive });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${level.name}"? This cannot be undone.`)) return;
    await deleteLevel.mutateAsync(level.id);
  }

  return (
    <Card className={!level.isActive ? 'opacity-60' : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{level.name}</CardTitle>
          <Badge variant={level.isActive ? 'success' : 'muted'}>
            {level.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-xs font-mono text-muted-foreground mt-1">{level.code}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {level.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {level.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {level.durationMonths && (
            <div>
              <span className="text-muted-foreground">Duration:</span>{' '}
              <span className="font-medium">{level.durationMonths} mo</span>
            </div>
          )}
          {level.fee && (
            <div>
              <span className="text-muted-foreground">Fee:</span>{' '}
              <span className="font-medium tabular-nums">{formatNPR(level.fee)}</span>
            </div>
          )}
        </div>

        {level.prerequisite && (
          <div className="text-xs text-muted-foreground">
            Requires:{' '}
            <span className="font-medium text-foreground">
              {level.prerequisite.name}
            </span>
          </div>
        )}

        {canManage && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onEdit}
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleActive}
              isLoading={update.isPending}
            >
              {level.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              className="text-destructive"
              isLoading={deleteLevel.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


