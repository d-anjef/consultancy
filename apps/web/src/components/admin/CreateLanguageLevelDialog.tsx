'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Languages } from 'lucide-react';
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
  useCreateLanguageLevel,
  useLanguageLevels,
} from '@/hooks/useLanguageLevels';
import type { ExamType } from '@/lib/api/language-levels';

const schema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/, 'Only uppercase letters, numbers, hyphens, underscores')
    .min(2)
    .max(50),
  name: z.string().trim().min(1, 'Required').max(200),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  examType: z.enum(['JLPT', 'NAT', 'CUSTOM']),
  order: z.coerce.number().int().min(0).default(0),
  durationMonths: z.coerce.number().int().min(1).max(60).optional(),
  prerequisiteId: z.string().optional(),
  fee: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'JLPT', label: 'JLPT (Japanese Language Proficiency Test)' },
  { value: 'NAT', label: 'NAT (Nihongo Achievement Test)' },
  { value: 'CUSTOM', label: 'Custom / Other' },
];

interface CreateLanguageLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLanguageLevelDialog({
  open,
  onOpenChange,
}: CreateLanguageLevelDialogProps) {
  const create = useCreateLanguageLevel();
  const { data: existingLevels = [] } = useLanguageLevels(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      examType: 'JLPT',
      order: 0,
      durationMonths: undefined,
      prerequisiteId: '',
      fee: undefined,
    },
  });

  async function onSubmit(values: FormValues) {
    await create.mutateAsync({
      code: values.code,
      name: values.name,
      description: values.description || undefined,
      examType: values.examType,
      order: values.order,
      durationMonths: values.durationMonths,
      prerequisiteId: values.prerequisiteId || undefined,
      fee: values.fee,
    });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Languages className="h-4 w-4 text-accent" />
            New Language Level
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Code <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="JLPT_N5" {...field} />
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
                    <FormLabel>
                      Exam Type <span className="text-destructive">*</span>
                    </FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="JLPT N5" {...field} />
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
                    <Textarea
                      rows={2}
                      placeholder="Beginner — Basic phrases, hiragana..."
                      {...field}
                    />
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
                    <FormLabel>Duration (months)</FormLabel>
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
                    <FormLabel>Fee (NPR)</FormLabel>
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
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {existingLevels.map((l) => (
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