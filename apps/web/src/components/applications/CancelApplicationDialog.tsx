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
import { useCancelApplication } from '@/hooks/useApplications';
import type { Application } from '@/lib/api/applications';

const cancelSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(500),
});

type CancelFormValues = z.infer<typeof cancelSchema>;

interface CancelApplicationDialogProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelApplicationDialog({
  application,
  open,
  onOpenChange,
}: CancelApplicationDialogProps) {
  const cancel = useCancelApplication(application?.id ?? '');

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
            Cancel Application
          </DialogTitle>
          {application && (
            <DialogDescription>
              Cancelling {application.applicationNumber}. This action cannot be undone.
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
                      rows={3}
                      placeholder="Why is this application being cancelled?"
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
                Keep Active
              </Button>
              <Button
                type="submit"
                variant="destructive"
                isLoading={cancel.isPending}
                loadingText="Cancelling…"
              >
                Cancel Application
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}