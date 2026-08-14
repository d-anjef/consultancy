'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stamp } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateVisaCategory } from '@/hooks/useVisaCategories';

const createSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_]+$/, 'Only uppercase letters, numbers, and underscores')
    .min(3)
    .max(50),
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  requiredDocumentTypes: z.string().trim().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof createSchema>;

interface CreateVisaCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateVisaCategoryDialog({
  open,
  onOpenChange,
}: CreateVisaCategoryDialogProps) {
  const create = useCreateVisaCategory();

  const form = useForm<FormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      requiredDocumentTypes: '',
    },
  });

  async function onSubmit(values: FormValues) {
    const docs = values.requiredDocumentTypes
      ? values.requiredDocumentTypes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    await create.mutateAsync({
      code: values.code,
      name: values.name,
      description: values.description || undefined,
      requiredDocumentTypes: docs,
    });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Stamp className="h-4 w-4 text-accent" />
            New Visa Category
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Code <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="STUDENT_PART_TIME" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Student Visa (Part-time)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="requiredDocumentTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Documents</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PASSPORT, PHOTO, TRANSCRIPT"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xxs text-muted-foreground mt-1">
                    Comma-separated list
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                isLoading={create.isPending}
                loadingText="Creating…"
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}