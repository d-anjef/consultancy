'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  BookOpen,
  Download,
  FileText,
  Trash2,
  Search,
} from 'lucide-react';
import { useLearningMaterials, useDeleteMaterial, downloadMaterial } from '@/hooks/useLearningMaterials';
import { useLanguageLevels } from '@/hooks/useLanguageLevels';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { UploadMaterialDialog } from '@/components/teachers-hub/UploadMaterialDiaglog';
import { formatFileSize } from '@/lib/utils/currency';
import type { MaterialCategory } from '@/lib/api/learning-materials';

const CATEGORIES: { value: MaterialCategory; label: string }[] = [
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
  { value: 'KANJI', label: 'Kanji' },
  { value: 'READING', label: 'Reading' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'WRITING', label: 'Writing' },
  { value: 'CULTURE', label: 'Culture' },
  { value: 'EXAM_PREP', label: 'Exam Prep' },
  { value: 'OTHER', label: 'Other' },
];

export default function TeachersHubPage() {
  const { isTeacher, isSuperAdmin, isAdmin } = usePermissions();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MaterialCategory | ''>('');
  const [levelId, setLevelId] = useState('');

  const { data: levels = [] } = useLanguageLevels();
  const { data, isLoading } = useLearningMaterials({
    search: search || undefined,
    category: category || undefined,
    languageLevelId: levelId || undefined,
    limit: 50,
  });

  const deleteMaterial = useDeleteMaterial();
  const canUpload = isTeacher || isSuperAdmin || isAdmin;
  const materials = data?.items ?? [];

  async function handleDownload(id: string, fileName: string) {
    await downloadMaterial(id, fileName);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await deleteMaterial.mutateAsync(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Teachers Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Study materials shared by teachers across all branches
          </p>
        </div>
        {canUpload && (
          <Button variant="accent" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            Upload Material
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <Select
          value={category || 'all'}
          onValueChange={(v) => {
            const val = v ?? '';
            setCategory(val === 'all' ? '' : (val as MaterialCategory));
          }}
        >
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={levelId || 'all'}
          onValueChange={(v) => {
            const val = v ?? '';
            setLevelId(val === 'all' ? '' : val);
          }}
        >
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials Grid */}
      {isLoading ? (
        <LoadingState message="Loading materials…" />
      ) : materials.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No materials yet"
            description={
              canUpload
                ? 'Upload your first study material to share with other teachers and students.'
                : 'No study materials available.'
            }
            action={
              canUpload ? (
                <Button variant="accent" onClick={() => setUploadOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Upload Material
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <Card key={m.id} className="hover:border-muted-foreground/20 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm leading-tight truncate">
                      {m.title}
                    </CardTitle>
                    <p className="text-xxs text-muted-foreground mt-1">
                      {m.uploadedBy.firstName} {m.uploadedBy.lastName} · {m.branch.name}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xxs">
                    {m.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {m.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {m.description}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {m.languageLevel && (
                    <Badge variant="accent" className="text-xxs">
                      {m.languageLevel.name}
                    </Badge>
                  )}
                  {m.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xxs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xxs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span className="truncate">{m.file.originalName}</span>
                  <span>·</span>
                  <span>{formatFileSize(m.file.sizeBytes)}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xxs text-muted-foreground">
                    {format(new Date(m.createdAt), 'MMM dd, yyyy')}
                    {m.downloadCount > 0 && ` · ${m.downloadCount} downloads`}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDownload(m.id, m.file.originalName)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {canUpload && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        onClick={() => handleDelete(m.id, m.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadMaterialDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}