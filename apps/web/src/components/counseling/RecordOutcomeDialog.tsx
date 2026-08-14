'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAttendCounseling } from '@/hooks/useCounseling';
import type { Counseling, CounselingResult } from '@/lib/api/counseling';

const outcomeSchema = z.object({
  result: z.enum(['QUALIFIED', 'NOT_QUALIFIED', 'NEEDS_FOLLOWUP']),
  notes: z.string().max(2000).optional().or(z.literal('')),
  nextSteps: z.string().max(2000).optional().or(z.literal('')),
  followUpDate: z.string().optional().or(z.literal('')),
});

type OutcomeFormValues = z.infer<typeof outcomeSchema>;

const RESULTS: { value: CounselingResult; label: string; description: string }[] = [
  {
    value: 'QUALIFIED',
    label: 'Qualified',
    description: 'Ready to proceed to registration',
  },
  {
    value: 'NEEDS_FOLLOWUP',
    label: 'Needs Follow-up',
    description: 'Requires another meeting',
  },
  {
    value: 'NOT_QUALIFIED',
    label: 'Not Qualified',
    description: 'Does not meet criteria',
  },
];

interface RecordOutcomeDialogProps {
  session: Counseling | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordOutcomeDialog({
  session,
  open,
  onOpenChange,
}: RecordOutcomeDialogProps) {
  const attend = useAttendCounseling(session?.id ?? '');

  const form = useForm<OutcomeFormValues>({
    resolver: zodResolver(outcomeSchema),
    defaultValues: {
      result: 'QUALIFIED',
      notes: '',
      nextSteps: '',
      followUpDate: '',
    },
  });

  const selectedResult = form.watch('result');

  async function onSubmit(values: OutcomeFormValues) {
    await attend.mutateAsync({
      outcome: {
        result: values.result,
        notes: values.notes || undefined,
        nextSteps: values.nextSteps || undefined,
      },
      followUpDate:
        values.result === 'NEEDS_FOLLOWUP' && values.followUpDate
          ? new Date(values.followUpDate).toISOString()
          : undefined,
    });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Record Outcome
          </DialogTitle>
          {session && (
            <DialogDescription>
              Recording outcome for {session.counselingNumber}
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Result <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RESULTS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          <div>
                            <div className="font-medium">{r.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {r.description}
                            </div>
                          </div>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observations from the session…"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextSteps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Steps</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What should happen next?"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedResult === 'NEEDS_FOLLOWUP' && (
              <FormField
                control={form.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                isLoading={attend.isPending}
                loadingText="Recording…"
              >
                Record Outcome
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}