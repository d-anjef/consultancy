'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock } from 'lucide-react';
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
import { useRescheduleCounseling } from '@/hooks/useCounseling';
import type { Counseling } from '@/lib/api/counseling';

const rescheduleSchema = z.object({
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z
    .string()
    .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm format'),
  reason: z.string().min(1, 'Reason is required').max(500),
});

type RescheduleFormValues = z.infer<typeof rescheduleSchema>;

interface RescheduleCounselingDialogProps {
  session: Counseling | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleCounselingDialog({
  session,
  open,
  onOpenChange,
}: RescheduleCounselingDialogProps) {
  const reschedule = useRescheduleCounseling(session?.id ?? '');

  const form = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      scheduledDate: '',
      scheduledTime: '',
      reason: '',
    },
  });

  useEffect(() => {
    if (open && session) {
      const dateOnly = new Date(session.scheduledDate).toISOString().split('T')[0];
      form.reset({
        scheduledDate: dateOnly,
        scheduledTime: session.scheduledTime,
        reason: '',
      });
    }
  }, [open, session, form]);

  async function onSubmit(values: RescheduleFormValues) {
    await reschedule.mutateAsync({
      scheduledDate: new Date(values.scheduledDate).toISOString(),
      scheduledTime: values.scheduledTime,
      reason: values.reason,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-accent" />
            Reschedule Session
          </DialogTitle>
          {session && (
            <DialogDescription>
              Rescheduling {session.counselingNumber}
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Time <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why is this being rescheduled?"
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
                isLoading={reschedule.isPending}
                loadingText="Rescheduling…"
              >
                Reschedule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}