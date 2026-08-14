'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Receipt } from 'lucide-react';
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
import { useCreatePayment } from '@/hooks/useFinance';
import { formatNPR } from '@/lib/utils/currency';
import type { Invoice, PaymentMethod } from '@/lib/api/finance';

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']),
  bankName: z.string().trim().optional().or(z.literal('')),
  chequeNumber: z.string().trim().optional().or(z.literal('')),
  transactionId: z.string().trim().optional().or(z.literal('')),
  paidAt: z.string().min(1, 'Payment date required'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
];

interface RecordPaymentDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const create = useCreatePayment();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      method: 'CASH',
      bankName: '',
      chequeNumber: '',
      transactionId: '',
      paidAt: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const method = form.watch('method');

  useEffect(() => {
    if (open && invoice) {
      form.reset({
        amount: invoice.balanceAmount,
        method: 'CASH',
        bankName: '',
        chequeNumber: '',
        transactionId: '',
        paidAt: new Date().toISOString().split('T')[0] as string,
        notes: '',
      });
    }
  }, [open, invoice, form]);

  async function onSubmit(values: PaymentFormValues) {
    if (!invoice) return;

    const methodDetails: Record<string, string> = {};
    if (values.bankName) methodDetails.bankName = values.bankName;
    if (values.chequeNumber) methodDetails.chequeNumber = values.chequeNumber;
    if (values.transactionId) methodDetails.transactionId = values.transactionId;

    await create.mutateAsync({
      invoiceId: invoice.id,
      amount: Number(values.amount),
      method: values.method,
      methodDetails: Object.keys(methodDetails).length > 0 ? methodDetails : undefined,
      paidAt: new Date(values.paidAt).toISOString(),
      notes: values.notes || undefined,
    });

    onOpenChange(false);
  }

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-accent" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            For invoice {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="tabular-nums">{formatNPR(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Already Paid</span>
            <span className="tabular-nums text-success">
              {formatNPR(invoice.paidAmount)}
            </span>
          </div>
          <div className="flex justify-between font-medium border-t border-border pt-1 mt-1">
            <span className="text-foreground">Outstanding</span>
            <span className="tabular-nums text-destructive">
              {formatNPR(invoice.balanceAmount)}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Amount <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0.01}
                        max={invoice.balanceAmount}
                        step="0.01"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paidAt"
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
            </div>

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Method <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {method === 'BANK_TRANSFER' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="NIC Asia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {method === 'CHEQUE' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chequeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cheque Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
                isLoading={create.isPending}
                loadingText="Recording…"
              >
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}