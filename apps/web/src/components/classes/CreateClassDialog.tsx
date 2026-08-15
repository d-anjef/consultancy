'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Label } from '@/components/ui/label';
import { useCreateClass } from '@/hooks/useClasses';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api/client';

interface Branch {
  id: string;
  code: string;
  name: string;
}

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Program {
  id: string;
  code: string;
  name: string;
}

interface LanguageLevel {
  id: string;
  code: string;
  name: string;
}

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  branchId: z.string().min(1, 'Branch required'),
  teacherId: z.string().min(1, 'Teacher required'),
  programId: z.string().optional(),
  languageLevelId: z.string().optional(),
  daysOfWeek: z.array(z.number()).min(1, 'Select at least one day'),
  startTime: z.string().regex(timeRegex, 'Time must be HH:mm'),
  endTime: z.string().regex(timeRegex, 'Time must be HH:mm'),
  roomOrLocation: z.string().trim().max(200).optional(),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
});

type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClassDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const create = useCreateClass();
const { data: branches = [] } = useQuery({
  queryKey: ['branches', 'active'],
  queryFn: () => api.get<Branch[]>('/branches/active'),
  staleTime: 5 * 60_000,
});

const { data: teachersRaw } = useQuery({
  queryKey: ['teachers', 'list'],
  queryFn: () => api.get<Teacher[]>('/teachers', { limit: 100 }),
  staleTime: 5 * 60_000,
});
const teachers: Teacher[] = Array.isArray(teachersRaw)
  ? teachersRaw
  : ((teachersRaw as any)?.items ?? []);

const { data: programsRaw } = useQuery({
  queryKey: ['programs', 'list'],
  queryFn: () => api.get<Program[]>('/programs'),
  staleTime: 5 * 60_000,
});
const programs: Program[] = Array.isArray(programsRaw)
  ? programsRaw
  : ((programsRaw as any)?.items ?? []);

const { data: levelsRaw } = useQuery({
  queryKey: ['language-levels', 'list'],
  queryFn: () => api.get<LanguageLevel[]>('/language-levels'),
  staleTime: 5 * 60_000,
});
const languageLevels: LanguageLevel[] = Array.isArray(levelsRaw)
  ? levelsRaw
  : ((levelsRaw as any)?.items ?? []);

  const isOrgWide = user?.role.code === 'SUPER_ADMIN' || user?.role.code === 'ADMIN';

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      branchId: user?.branch?.id ?? '',
      teacherId: '',
      programId: '',
      languageLevelId: '',
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '07:00',
      endTime: '09:00',
      roomOrLocation: '',
      startDate: '',
      endDate: '',
      notes: '',
    },
  });

  const days = form.watch('daysOfWeek');

  function toggleDay(day: number) {
    const current = days || [];
    if (current.includes(day)) {
      form.setValue('daysOfWeek', current.filter((d) => d !== day));
    } else {
      form.setValue('daysOfWeek', [...current, day].sort());
    }
  }

  async function onSubmit(v: Values) {
    try {
      await create.mutateAsync({
        name: v.name,
        branchId: v.branchId,
        teacherId: v.teacherId,
        programId: v.programId || undefined,
        languageLevelId: v.languageLevelId || undefined,
        schedule: {
          daysOfWeek: v.daysOfWeek,
          startTime: v.startTime,
          endTime: v.endTime,
          roomOrLocation: v.roomOrLocation || undefined,
        },
        startDate: new Date(v.startDate).toISOString(),
        endDate: v.endDate ? new Date(v.endDate).toISOString() : undefined,
        notes: v.notes || undefined,
      });
      toast.success('Class created');
      form.reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create class');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Class</DialogTitle>
          <DialogDescription>
            Create a class with schedule and teacher assignment
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Class Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="N5 Morning Batch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isOrgWide && (
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((b) => (
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
              )}

              <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No teachers found. Create a Teacher user first
                            (and ensure account is active).
                          </div>
                        ) : (
                          teachers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.firstName} {t.lastName}
                              {t.employeeId ? ` (${t.employeeId})` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programs.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No programs yet.
                          </div>
                        ) : (
                          programs.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="languageLevelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languageLevels.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No language levels yet.
                          </div>
                        ) : (
                          languageLevels.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule */}
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Schedule</h3>

              <div className="space-y-2">
                <Label>Days of Week *</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        days.includes(d.value)
                          ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                          : 'bg-background border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                {form.formState.errors.daysOfWeek && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.daysOfWeek.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time *</FormLabel>
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
                name="roomOrLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room / Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Room 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optional…" {...field} />
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
                isLoading={create.isPending}
                loadingText="Creating…"
              >
                Create Class
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
