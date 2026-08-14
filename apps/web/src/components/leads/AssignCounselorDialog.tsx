'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
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
import { Button } from '@/components/ui/button';
import { useAssignCounselor } from '@/hooks/useLeads';
import type { Lead } from '@/lib/api/leads';

const assignSchema = z.object({
  counselorId: z.string().min(1, 'Please select a counselor'),
});

type AssignFormValues = z.infer<typeof assignSchema>;

interface CounselorOption {
  id: string;
  email: string;
  role: { code: string };
  profile: { firstName: string; lastName: string };
}

function useCounselors(branchId?: string) {
  return useQuery({
    queryKey: ['users', 'counselors', branchId],
    queryFn: () =>
      api.get<CounselorOption[]>('/users', {
        roleCode: 'COUNSELOR',
        branchId,
        status: 'ACTIVE',
        limit: 100,
      }),
    enabled: !!branchId,
    staleTime: 2 * 60 * 1000,
  });
}

interface AssignCounselorDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignCounselorDialog({
  lead,
  open,
  onOpenChange,
}: AssignCounselorDialogProps) {
  const assign = useAssignCounselor(lead?.id ?? '');
  const { data: counselors = [], isLoading: loadingCounselors } = useCounselors(
    lead?.branch.id,
  );

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      counselorId: lead?.assignedCounselor?.id ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ counselorId: lead?.assignedCounselor?.id ?? '' });
    }
  }, [open, lead, form]);

  async function onSubmit(values: AssignFormValues) {
    await assign.mutateAsync({ counselorId: values.counselorId });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-accent" />
            Assign Counselor
          </DialogTitle>
          {lead && (
            <DialogDescription>
              Assigning for{' '}
              <span className="font-medium text-foreground">
                {lead.personal.firstName} {lead.personal.lastName}
              </span>
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="counselorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Counselor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingCounselors}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingCounselors ? 'Loading…' : 'Select counselor'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {counselors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.profile.firstName} {c.profile.lastName}
                        </SelectItem>
                      ))}
                      {!loadingCounselors && counselors.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No counselors in this branch
                        </div>
                      )}
                    </SelectContent>
                  </Select>
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
                isLoading={assign.isPending || loadingCounselors}
                loadingText="Assigning…"
              >
                Assign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}