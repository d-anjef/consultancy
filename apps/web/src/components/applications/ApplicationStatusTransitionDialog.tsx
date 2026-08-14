'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useChangeApplicationStatus } from '@/hooks/useApplications';
import type { Application, ApplicationStatus } from '@/lib/api/applications';
import {
  ALLOWED_APPLICATION_TRANSITIONS,
  APPLICATION_STATUS_LABELS,
  ApplicationStatusBadge,
} from './ApplicationStatusBadge';

const transitionSchema = z.object({
  status: z.string().min(1, 'Select a status'),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});

type TransitionFormValues = z.infer<typeof transitionSchema>;

interface ApplicationStatusTransitionDialogProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationStatusTransitionDialog({
  application,
  open,
  onOpenChange,
}: ApplicationStatusTransitionDialogProps) {
  const change = useChangeApplicationStatus(application?.id ?? '');

  const allowedNext = useMemo<ApplicationStatus[]>(() => {
    if (!application) return [];
    return ALLOWED_APPLICATION_TRANSITIONS[application.status] ?? [];
  }, [application]);

  const form = useForm<TransitionFormValues>({
    resolver: zodResolver(transitionSchema),
    defaultValues: {
      status: allowedNext[0] ?? '',
      reason: '',
    },
  });

  useEffect(() => {
    if (open && allowedNext.length > 0) {
      form.reset({ status: allowedNext[0], reason: '' });
    }
  }, [open, allowedNext, form]);

  async function onSubmit(values: TransitionFormValues) {
    await change.mutateAsync({
      status: values.status as ApplicationStatus,
      reason: values.reason || undefined,
    });
    onOpenChange(false);
  }

  const isTerminal = allowedNext.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowRight className="h-4 w-4 text-accent" />
            Change Application Status
          </DialogTitle>
          {application && (
            <DialogDescription className="flex items-center gap-2">
              Current: <ApplicationStatusBadge status={application.status} />
            </DialogDescription>
          )}
        </DialogHeader>

        {isTerminal ? (
          <div className="py-4 text-sm text-muted-foreground text-center">
            This application is in a terminal state ({application?.status}) and cannot
            transition further.
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allowedNext.map((s) => (
                          <SelectItem key={s} value={s}>
                            {APPLICATION_STATUS_LABELS[s]}
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
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Reason{' '}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
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
                  isLoading={change.isPending}
                  loadingText="Updating…"
                >
                  Update Status
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}