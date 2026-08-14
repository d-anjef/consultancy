'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCancelCounseling } from '@/hooks/useCounseling';
import type { Counseling } from '@/lib/api/counseling';

const cancelSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

type CancelFormValues = z.infer<typeof cancelSchema>;

interface CancelCounselingDialogProps {
  session: Counseling | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelCounselingDialog({
  session,
  open,
  onOpenChange,
}: CancelCounselingDialogProps) {
  const cancel = useCancelCounseling(session?.id ?? '');

  const form = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '' },
  });

  async function onSubmit(values: CancelFormValues) {
    await cancel.mutateAsync({ reason: values.reason });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <XCircle className="h-4 w-4 text-destructive" />
            Cancel Session
          </DialogTitle>
          {session && (
            <DialogDescription>
              Cancelling {session.counselingNumber}. This cannot be undone.
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="Why is this being cancelled?"
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
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Keep Session
              </Button>
              <Button
                type="submit"
                variant="destructive"
                isLoading={cancel.isPending}
                loadingText="Cancelling…"
              >
                Cancel Session
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}