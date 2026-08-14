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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUploadDocument } from '@/hooks/useDocuments';
import { formatFileSize } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

const uploadSchema = z.object({
  documentType: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'At least 2 characters')
    .max(50, 'Max 50 characters'),
  documentName: z.string().trim().min(1, 'Document name required').max(200),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const COMMON_DOCUMENT_TYPES = [
  'PASSPORT',
  'PHOTO',
  'TRANSCRIPT',
  'CITIZENSHIP',
  'BANK_STATEMENT',
  'SPONSOR_LETTER',
  'EDUCATION_CERTIFICATE',
  'RESUME',
  'HEALTH_CERTIFICATE',
  'POLICE_REPORT',
  'OFFER_LETTER',
];

const MAX_SIZE_MB = 15;

interface UploadDocumentDialogProps {
  studentId: string;
  studentName: string;
  applicationId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDocumentDialog({
  studentId,
  studentName,
  applicationId,
  open,
  onOpenChange,
}: UploadDocumentDialogProps) {
  const upload = useUploadDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      documentType: '',
      documentName: '',
      description: '',
      expiryDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setSelectedFile(null);
      setError(null);
    }
  }, [open, form]);

  const validateFile = useCallback((file: File): string | null => {
    const maxBytes = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File exceeds ${MAX_SIZE_MB}MB limit`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setSelectedFile(file);
      // Auto-fill document name from file name
      if (!form.getValues('documentName')) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        form.setValue('documentName', nameWithoutExt);
      }
    },
    [form, validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  async function onSubmit(values: UploadFormValues) {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }
    try {
      await upload.mutateAsync({
        metadata: {
          studentId,
          applicationId,
          documentType: values.documentType,
          documentName: values.documentName,
          description: values.description || undefined,
          expiryDate: values.expiryDate
            ? new Date(values.expiryDate).toISOString()
            : undefined,
          notes: values.notes || undefined,
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
            Upload Document
          </DialogTitle>
          <DialogDescription>Uploading for {studentName}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Drop Zone */}
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
                    'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
                    dragActive
                      ? 'border-accent bg-accent-light'
                      : 'border-border bg-secondary/30 hover:bg-secondary/50',
                  )}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG, DOC — max {MAX_SIZE_MB}MB
                  </p>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleInputChange}
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
              {error && (
                <p className="text-xs text-destructive mt-1.5">{error}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Document Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="PASSPORT"
                        {...field}
                        list="document-types"
                      />
                    </FormControl>
                    <datalist id="document-types">
                      {COMMON_DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Document Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Passport - Front page" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date (if applicable)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
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