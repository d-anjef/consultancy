'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateCounseling } from '@/hooks/useCounseling';
import { api } from '@/lib/api/client';
import type { Lead } from '@/lib/api/leads';

interface CounselorOption {
  id: string;
  email: string;
  status: string;
  profile: { firstName: string; lastName: string };
  branch: { id: string; name: string } | null;
}

interface LeadOption {
  id: string;
  leadNumber: string;
  personal: { firstName: string; lastName: string; phone: string };
  branch: { id: string; name: string };
  assignedCounselor?: { id: string; firstName: string; lastName: string } | null;
}

const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;

const schema = z.object({
  leadId: z.string().min(1, 'Lead is required'),
  counselorId: z.string().min(1, 'Counselor is required'),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().regex(timeRegex, 'Time must be HH:mm'),
  durationMinutes: z.coerce.number().int().min(15).max(480),
});

type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, pre-fills the lead (used from lead detail page) */
  lead?: Lead | null;
}

export function ScheduleCounselingDialog({ open, onOpenChange, lead }: Props) {
  const create = useCreateCounseling();

  // Fetch all leads if no pre-selected lead (for /counseling page usage)
  const { data: leadsRaw } = useQuery({
    queryKey: ['leads', 'for-counseling-schedule'],
    queryFn: () =>
      api.get<LeadOption[]>('/leads', {
        limit: 100,
        status: 'CONTACTED,COUNSELING_BOOKED,FOLLOW_UP,INTERESTED,NEW',
      }),
    enabled: open && !lead,
    staleTime: 60_000,
  });
  const leads: LeadOption[] = Array.isArray(leadsRaw)
    ? leadsRaw
    : ((leadsRaw as any)?.items ?? []);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      leadId: lead?.id ?? '',
      counselorId: lead?.assignedCounselor?.id ?? '',
      scheduledDate: '',
      scheduledTime: '10:00',
      durationMinutes: 60,
    },
  });

  const selectedLeadId = form.watch('leadId');

  // Find the selected lead's branch to filter counselors
  const selectedLead = lead || leads.find((l) => l.id === selectedLeadId);
  const selectedBranchId = selectedLead?.branch?.id;

  // Fetch counselors for the selected lead's branch
  const { data: counselorsRaw } = useQuery({
    queryKey: ['users', 'counselors', selectedBranchId],
    queryFn: () =>
      api.get<CounselorOption[]>('/users', {
        roleCode: 'COUNSELOR',
        branchId: selectedBranchId,
        limit: 100,
      }),
    enabled: !!selectedBranchId,
    staleTime: 60_000,
  });
  const counselors: CounselorOption[] = Array.isArray(counselorsRaw)
    ? counselorsRaw
    : ((counselorsRaw as any)?.items ?? []);
  const activeCounselors = counselors.filter((c) => c.status === 'ACTIVE');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        leadId: lead?.id ?? '',
        counselorId: lead?.assignedCounselor?.id ?? '',
        scheduledDate: '',
        scheduledTime: '10:00',
        durationMinutes: 60,
      });
    }
  }, [open, lead, form]);

  // Auto-select assigned counselor when lead is chosen
  useEffect(() => {
    if (selectedLead?.assignedCounselor?.id && !form.getValues('counselorId')) {
      form.setValue('counselorId', selectedLead.assignedCounselor.id);
    }
  }, [selectedLead, form]);

  async function onSubmit(v: Values) {
    try {
      // Combine date + convert to ISO for datetime validation
      const scheduledDateISO = new Date(v.scheduledDate).toISOString();

      await create.mutateAsync({
        leadId: v.leadId,
        counselorId: v.counselorId,
        scheduledDate: scheduledDateISO,
        scheduledTime: v.scheduledTime,
        durationMinutes: v.durationMinutes,
      });
      toast.success('Counseling session scheduled');
      form.reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to schedule');
    }
  }

  // Get today's date in YYYY-MM-DD format for min date
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-accent" />
            Schedule Counseling
          </DialogTitle>
          <DialogDescription>
            {lead
              ? `For ${lead.personal.firstName} ${lead.personal.lastName} (${lead.leadNumber})`
              : 'Select a lead and schedule a counseling session'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Lead selector (only if no lead pre-filled) */}
            {!lead && (
              <FormField
                control={form.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leads.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No available leads. Create a lead first.
                          </div>
                        ) : (
                          leads.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.personal.firstName} {l.personal.lastName} ({l.leadNumber})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Counselor */}
            <FormField
              control={form.control}
              name="counselorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Counselor *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedBranchId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !selectedBranchId
                              ? 'Select a lead first'
                              : 'Select counselor'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeCounselors.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          No active counselors in this branch.
                        </div>
                      ) : (
                        activeCounselors.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.profile.firstName} {c.profile.lastName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" min={todayStr} {...field} />
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
                    <FormLabel>Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration */}
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes) *</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v, 10))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
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
                isLoading={create.isPending}
                loadingText="Scheduling…"
              >
                Schedule Session
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}