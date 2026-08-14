'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit } from 'lucide-react';
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
import {
  useUpdateLanguageLevel,
  useLanguageLevels,
} from '@/hooks/useLanguageLevels';
import type { ExamType, LanguageLevel } from '@/lib/api/language-levels';

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  examType: z.enum(['JLPT', 'NAT', 'CUSTOM']),
  order: z.coerce.number().int().min(0),
  durationMonths: z.coerce.number().int().min(1).max(60).optional(),
  prerequisiteId: z.string().optional(),
  fee: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'JLPT', label: 'JLPT' },
  { value: 'NAT', label: 'NAT' },
  { value: 'CUSTOM', label: 'Custom' },
];

interface EditLanguageLevelDialogProps {
  level: LanguageLevel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLanguageLevelDialog({
  level,
  open,
  onOpenChange,
}: EditLanguageLevelDialogProps) {
  const update = useUpdateLanguageLevel(level?.id ?? '');
  const { data: existingLevels = [] } = useLanguageLevels(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      examType: 'JLPT',
      order: 0,
      durationMonths: undefined,
      prerequisiteId: '',
      fee: undefined,
    },
  });

  useEffect(() => {
    if (open && level) {
      form.reset({
        name: level.name,
        description: level.description ?? '',
        examType: level.examType,
        order: level.order,
        durationMonths: level.durationMonths,
        prerequisiteId: level.prerequisite?.id ?? '',
        fee: level.fee,
      });
    }
  }, [open, level, form]);

  async function onSubmit(values: FormValues) {
    if (!level) return;

    await update.mutateAsync({
      name: values.name,
      description: values.description || undefined,
      examType: values.examType,
      order: values.order,
      durationMonths: values.durationMonths,
      prerequisiteId: values.prerequisiteId || null,
      fee: values.fee,
    });
    onOpenChange(false);
  }

  if (!level) return null;

  const otherLevels = existingLevels.filter((l) => l.id !== level.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Edit className="h-4 w-4 text-accent" />
            Edit Language Level
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md bg-secondary/30 p-2 text-xs font-mono text-muted-foreground">
          Code: {level.code} (cannot change)
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="examType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXAM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={60} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="prerequisiteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prerequisite Level</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {otherLevels.map((l) => (
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
                isLoading={update.isPending}
                loadingText="Saving…"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}