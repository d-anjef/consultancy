'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateTemplate } from '@/hooks/useJourney';
import { api } from '@/lib/api/client';

interface VisaCategory {
  id: string;
  code: string;
  name: string;
}

const milestoneSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, underscores only')
    .min(1, 'Key required')
    .max(50),
  title: z.string().trim().min(1, 'Title required').max(200),
  description: z.string().trim().max(500).optional(),
  isRequired: z.boolean().default(true),
  estimatedDays: z.number().int().min(0).max(3650).optional(),
});

const schema = z.object({
  visaCategoryId: z.string().min(1, 'Visa category required'),
  name: z.string().trim().min(1, 'Name required').max(200),
  description: z.string().trim().max(1000).optional(),
  milestones: z.array(milestoneSchema).min(1, 'At least one milestone required'),
});

type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTemplateDialog({ open, onOpenChange }: Props) {
  const create = useCreateTemplate();

  const { data: visaRaw } = useQuery({
    queryKey: ['visa-categories', 'list'],
    queryFn: () =>
      api.get<VisaCategory[] | { items: VisaCategory[] }>('/visa-categories'),
    staleTime: 5 * 60_000,
  });
  const visaCategories: VisaCategory[] = Array.isArray(visaRaw)
    ? visaRaw
    : ((visaRaw as any)?.items ?? []);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      visaCategoryId: '',
      name: '',
      description: '',
      milestones: [
        { key: 'registration', title: 'Registration', isRequired: true },
      ],
    },
  });

  const milestones = form.watch('milestones');

  function addMilestone() {
    form.setValue('milestones', [
      ...milestones,
      { key: '', title: '', isRequired: true },
    ]);
  }

  function removeMilestone(idx: number) {
    form.setValue(
      'milestones',
      milestones.filter((_, i) => i !== idx),
    );
  }

  function moveMilestone(idx: number, dir: 'up' | 'down') {
    const arr = [...milestones];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target]!, arr[idx]!];
    form.setValue('milestones', arr);
  }

  async function onSubmit(v: Values) {
    try {
      await create.mutateAsync({
        visaCategoryId: v.visaCategoryId,
        name: v.name,
        description: v.description || undefined,
        milestones: v.milestones.map((m, i) => ({
          key: m.key,
          title: m.title,
          description: m.description || undefined,
          order: i,
          isRequired: m.isRequired,
          estimatedDays: m.estimatedDays,
        })),
      });
      toast.success('Template created');
      form.reset();
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to create';
      if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('conflict')) {
        toast.error('A template already exists for this visa category. Delete the existing one first.');
      } else {
        toast.error(msg);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Journey Template</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visaCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visa Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visa category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {visaCategories.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No visa categories. Create one first at /visa-categories
                          </div>
                        ) : (
                          visaCategories.map((vc) => (
                            <SelectItem key={vc.id} value={vc.id}>
                              {vc.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Student Visa Journey"
                        {...field}
                      />
                    </FormControl>
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
                    <Textarea rows={2} placeholder="Optional…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Milestones ({milestones.length})
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addMilestone}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Milestone
                </Button>
              </div>

              {milestones.map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-muted/30 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Step {idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => moveMilestone(idx, 'up')}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => moveMilestone(idx, 'down')}
                        disabled={idx === milestones.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      {milestones.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeMilestone(idx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`milestones.${idx}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Key *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="registration"
                              {...field}
                              className="font-mono text-xs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`milestones.${idx}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Registration" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`milestones.${idx}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`milestones.${idx}.estimatedDays`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Estimated Days</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : undefined,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`milestones.${idx}.isRequired`}
                      render={({ field }) => (
                        <FormItem className="flex items-end pb-2">
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-xs !mt-0 cursor-pointer">
                              Required milestone
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

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
                Create Template
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}