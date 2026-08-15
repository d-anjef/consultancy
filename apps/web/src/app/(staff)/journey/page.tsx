'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useMilestoneTemplates, useDeleteTemplate } from '@/hooks/useJourney';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateTemplateDialog } from '@/components/journey/CreateTemplateDialog';

export default function JourneyTemplatesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: templates = [], isLoading } = useMilestoneTemplates(true);
  const deleteTemplate = useDeleteTemplate();

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      toast.success('Template deleted');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to delete');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Journey Templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure milestone journeys per visa category
          </p>
        </div>
        <Button variant="accent" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading templates…" />
      ) : templates.length === 0 ? (
        <Card>
          <EmptyState
            icon={MapPin}
            title="No templates yet"
            description="Create a journey template to define milestones for a visa category."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-tight">
                      {template.name}
                    </CardTitle>
                    <p className="mt-1 text-xs font-mono text-muted-foreground">
                      {template.visaCategory.code}
                    </p>
                  </div>
                  <Badge variant={template.isActive ? 'success' : 'muted'}>
                    {template.isActive ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium tabular-nums text-foreground">
                    {template.milestoneCount}
                  </span>
                  <span className="text-muted-foreground">milestones</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Link
                    href={`/journey/${template.id}`}
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                      className: 'flex-1',
                    })}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the template. Existing student journeys are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}