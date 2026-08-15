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
import { useTransitionLeadStatus } from '@/hooks/useLeads';
import type { Lead, LeadStatus } from '@/lib/api/leads';
import { LeadStatusBadge } from './LeadStatusBadge';

const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['COUNSELING_BOOKED', 'FOLLOW_UP', 'NOT_INTERESTED', 'LOST'],
  COUNSELING_BOOKED: ['COUNSELING_ATTENDED', 'NO_SHOW', 'LOST'],
  COUNSELING_ATTENDED: ['INTERESTED', 'NOT_INTERESTED', 'FOLLOW_UP', 'LOST'],
  NO_SHOW: ['FOLLOW_UP', 'COUNSELING_BOOKED', 'LOST'],
  FOLLOW_UP: ['CONTACTED', 'COUNSELING_BOOKED', 'NOT_INTERESTED', 'LOST'],
  INTERESTED: ['QUALIFIED', 'FOLLOW_UP', 'NOT_INTERESTED', 'LOST'],
  QUALIFIED: ['FOLLOW_UP', 'NOT_INTERESTED', 'LOST'],
  NOT_INTERESTED: ['FOLLOW_UP', 'LOST'],
  CONVERTED: [],
  LOST: [],
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  COUNSELING_BOOKED: 'Counseling Booked',
  COUNSELING_ATTENDED: 'Counseling Attended',
  NO_SHOW: 'No Show',
  FOLLOW_UP: 'Follow Up',
  INTERESTED: 'Interested',
  QUALIFIED: 'Qualified',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Not Interested',
  LOST: 'Lost',
};

const transitionSchema = z.object({
  status: z.enum([
    'NEW',
    'CONTACTED',
    'COUNSELING_BOOKED',
    'COUNSELING_ATTENDED',
    'NO_SHOW',
    'FOLLOW_UP',
    'INTERESTED',
    'QUALIFIED',
    'CONVERTED',
    'NOT_INTERESTED',
    'LOST',
  ]),
  reason: z.string().max(500).optional().or(z.literal('')),
});

type TransitionFormValues = z.infer<typeof transitionSchema>;

interface LeadStatusTransitionDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadStatusTransitionDialog({
  lead,
  open,
  onOpenChange,
}: LeadStatusTransitionDialogProps) {
  const transition = useTransitionLeadStatus(lead?.id ?? '');

  const allowedNext = useMemo<LeadStatus[]>(() => {
    if (!lead) return [];
    return ALLOWED_TRANSITIONS[lead.status] ?? [];
  }, [lead]);

  const form = useForm<TransitionFormValues>({
    resolver: zodResolver(transitionSchema),
    defaultValues: {
      status: allowedNext[0] ?? 'CONTACTED',
      reason: '',
    },
  });

  useEffect(() => {
    if (open && allowedNext.length > 0) {
      form.reset({ status: allowedNext[0], reason: '' });
    }
  }, [open, allowedNext, form]);

  async function onSubmit(values: TransitionFormValues) {
    await transition.mutateAsync({
      status: values.status,
      reason: values.reason || undefined,
    });
    onOpenChange(false);
  }

  const isTerminal = allowedNext.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowRight className="h-4 w-4 text-accent" />
            Update Lead Status
          </DialogTitle>
          {lead && (
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                <span>Current:</span>
          <LeadStatusBadge status={lead.status} />
          </div>
          )}
        </DialogHeader>

        {isTerminal ? (
          <div className="py-4 text-sm text-muted-foreground text-center">
            This lead is in a terminal state ({lead?.status}) and cannot be
            transitioned further.
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
                            {STATUS_LABELS[s]}
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
                      <Textarea
                        placeholder="Briefly explain the reason…"
                        rows={3}
                        {...field}
                      />
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
                  isLoading={transition.isPending}
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