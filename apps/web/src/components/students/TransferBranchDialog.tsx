'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
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
import { useTransferStudent } from '@/hooks/useStudents';
import { branchesApi } from '@/lib/api/endpoints/branches.api';
import type { Student } from '@/lib/api/students';

const transferSchema = z.object({
  branchId: z.string().min(1, 'Select a destination branch'),
  reason: z.string().trim().min(1, 'Reason is required').max(500),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferBranchDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferBranchDialog({
  student,
  open,
  onOpenChange,
}: TransferBranchDialogProps) {
  const transfer = useTransferStudent(student?.id ?? '');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', 'active'],
    queryFn: () => branchesApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { branchId: '', reason: '' },
  });

  async function onSubmit(values: TransferFormValues) {
    await transfer.mutateAsync({
      branchId: values.branchId,
      reason: values.reason,
    });
    form.reset();
    onOpenChange(false);
  }

  // Filter out current branch
  const availableBranches = branches.filter((b) => b.id !== student?.branch.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-accent" />
            Transfer Branch
          </DialogTitle>
          {student && (
            <DialogDescription>
              Moving {student.personal.firstName} {student.personal.lastName} from{' '}
              <span className="font-medium text-foreground">{student.branch.name}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Destination Branch <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBranches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
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
                    Reason <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Why is this student being transferred?"
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
                variant="accent"
                isLoading={transfer.isPending}
                loadingText="Transferring…"
              >
                Transfer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}