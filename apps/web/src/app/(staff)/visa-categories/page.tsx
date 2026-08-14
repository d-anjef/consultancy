'use client';

import { useState } from 'react';
import { Plus, Stamp } from 'lucide-react';
import { useVisaCategories, useUpdateVisaCategory } from '@/hooks/useVisaCategories';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { CreateVisaCategoryDialog } from '@/components/admin/CreateVisaCategoryDialog';
import type { VisaCategory } from '@/lib/api/visa-categories';

export default function VisaCategoriesPage() {
  const { has } = usePermissions();
  const { data: categories = [], isLoading } = useVisaCategories();
  const [createOpen, setCreateOpen] = useState(false);

  const canManage = has(PERMISSION_CODES.MANAGE_VISA_CATEGORIES);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Visa Categories
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage visa pathways for student applications
          </p>
        </div>
        {canManage && (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading visa categories…" />
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Stamp}
            title="No visa categories yet"
            description={canManage ? 'Create your first visa category.' : 'No categories available.'}
            action={
              canManage ? (
                <Button variant="accent" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Category
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <VisaCard key={c.id} category={c} canManage={canManage} />
          ))}
        </div>
      )}

      <CreateVisaCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function VisaCard({
  category,
  canManage,
}: {
  category: VisaCategory;
  canManage: boolean;
}) {
  const update = useUpdateVisaCategory(category.id);

  async function toggleActive() {
    await update.mutateAsync({ isActive: !category.isActive });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{category.name}</CardTitle>
          <Badge variant={category.isActive ? 'success' : 'muted'}>
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          {category.code}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {category.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {category.description}
          </p>
        )}
        {category.requiredDocumentTypes.length > 0 && (
          <div>
            <p className="text-xxs uppercase tracking-wider text-muted-foreground mb-2">
              Required Documents
            </p>
            <div className="flex flex-wrap gap-1">
              {category.requiredDocumentTypes.map((doc) => (
                <Badge key={doc} variant="outline" className="text-xxs">
                  {doc}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={toggleActive}
            isLoading={update.isPending}
          >
            {category.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}