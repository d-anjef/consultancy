'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUploadMaterial } from '@/hooks/useLearningMaterials';
import { useLanguageLevels } from '@/hooks/useLanguageLevels';
import { formatFileSize } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import type { MaterialCategory } from '@/lib/api/learning-materials';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  category: z.enum([
    'GRAMMAR', 'VOCABULARY', 'KANJI', 'READING', 'LISTENING',
    'SPEAKING', 'WRITING', 'CULTURE', 'EXAM_PREP', 'OTHER',
  ]),
  languageLevelId: z.string().optional(),
  tags: z.string().trim().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

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

const MAX_SIZE_MB = 50;

interface UploadMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadMaterialDialog({
  open,
  onOpenChange,
}: UploadMaterialDialogProps) {
  const upload = useUploadMaterial();
  const { data: levels = [] } = useLanguageLevels();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      category: 'GRAMMAR',
      languageLevelId: '',
      tags: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setSelectedFile(null);
      setError(null);
    }
  }, [open, form]);

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_SIZE_MB}MB limit`);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  async function onSubmit(values: FormValues) {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }
    try {
      const tags = values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await upload.mutateAsync({
        metadata: {
          title: values.title,
          description: values.description || undefined,
          category: values.category,
          languageLevelId: values.languageLevelId || undefined,
          tags,
        },
        file: selectedFile,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-accent" />
            Upload Study Material
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Drop */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                File <span className="text-destructive">*</span>
              </label>
              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
                    dragActive
                      ? 'border-accent bg-accent-light'
                      : 'border-border bg-secondary/30 hover:bg-secondary/50',
                  )}
                >
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Drop file or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, JPG, PNG — max {MAX_SIZE_MB}MB
                  </p>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="N5 Grammar — Particles Reference" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="languageLevelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Any level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Any Level</SelectItem>
                        {levels.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="particles, grammar, beginner" {...field} />
                  </FormControl>
                  <p className="text-xxs text-muted-foreground">
                    Comma-separated
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                isLoading={upload.isPending}
                loadingText="Uploading…"
                disabled={!selectedFile}
              >
                Upload
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}