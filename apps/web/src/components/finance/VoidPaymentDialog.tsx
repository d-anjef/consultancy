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
import { useVoidPayment } from '@/hooks/useFinance';
import { formatNPR } from '@/lib/utils/currency';
import type { Payment } from '@/lib/api/finance';

const schema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(500),
});

type FormValues = z.infer<typeof schema>;

interface VoidPaymentDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoidPaymentDialog({
  payment,
  open,
  onOpenChange,
}: VoidPaymentDialogProps) {
  const voidPayment = useVoidPayment(payment?.id ?? '');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  async function onSubmit(values: FormValues) {
    await voidPayment.mutateAsync(values.reason);
    form.reset();
    onOpenChange(false);
  }

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <XCircle className="h-4 w-4 text-destructive" />
            Void Payment
          </DialogTitle>
          <DialogDescription>
            Voiding {payment.receiptNumber} ({formatNPR(payment.amount)}). The invoice
            balance will be restored.
          </DialogDescription>
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
                      rows={4}
                      placeholder="Why is this payment being voided?"
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
                Keep Payment
              </Button>
              <Button
                type="submit"
                variant="destructive"
                isLoading={voidPayment.isPending}
                loadingText="Voiding…"
              >
                Void Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}