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
import { useRejectDocument, useRequestResubmission } from '@/hooks/useDocuments';
import type { DocumentEntity } from '@/lib/api/documents';

const schema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(500),
});

type FormValues = z.infer<typeof schema>;

interface RejectDocumentDialogProps {
  document: DocumentEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If true, requests resubmission instead of rejection */
  requestResubmit?: boolean;
}

export function RejectDocumentDialog({
  document,
  open,
  onOpenChange,
  requestResubmit = false,
}: RejectDocumentDialogProps) {
  const reject = useRejectDocument(document?.id ?? '');
  const resubmit = useRequestResubmission(document?.id ?? '');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  async function onSubmit(values: FormValues) {
    if (requestResubmit) {
      await resubmit.mutateAsync(values.reason);
    } else {
      await reject.mutateAsync(values.reason);
    }
    form.reset();
    onOpenChange(false);
  }

  const title = requestResubmit ? 'Request Resubmission' : 'Reject Document';
  const action = requestResubmit ? 'Request Resubmission' : 'Reject';
  const loadingText = requestResubmit ? 'Requesting…' : 'Rejecting…';
  const isPending = requestResubmit ? resubmit.isPending : reject.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <XCircle className="h-4 w-4 text-destructive" />
            {title}
          </DialogTitle>
          {document && (
            <DialogDescription>
              {document.documentNumber} · {document.documentName}
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
                      rows={4}
                      placeholder={
                        requestResubmit
                          ? 'What needs to be corrected or re-uploaded?'
                          : 'Why is this document being rejected?'
                      }
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
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                isLoading={isPending}
                loadingText={loadingText}
              >
                {action}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}