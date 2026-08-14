'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
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
import { useCreateApplication } from '@/hooks/useApplications';
import { usePrograms } from '@/hooks/usePrograms';
import { useVisaCategories } from '@/hooks/useVisaCategories';
import { api } from '@/lib/api/client';
import type { Student } from '@/lib/api/students';

const createApplicationSchema = z.object({
  visaCategoryId: z.string().min(1, 'Visa category is required'),
  programId: z.string().min(1, 'Program is required'),
  schoolName: z.string().trim().min(1, 'School/company name required').max(300),
  schoolCountry: z.string().trim().min(1).default('Japan'),
  intakeYear: z.coerce.number().int().min(2024).max(2100),
  intakeSession: z.enum(['SPRING', 'FALL', 'WINTER', 'SUMMER', 'NONE']).default('NONE'),
  assignedCounselorId: z.string().min(1, 'Counselor is required'),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

type CreateApplicationFormValues = z.infer<typeof createApplicationSchema>;

interface CounselorOption {
  id: string;
  email: string;
  profile: { firstName: string; lastName: string };
  branch?: { id: string } | null;
}

interface CreateApplicationDialogProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateApplicationDialog({
  student,
  open,
  onOpenChange,
}: CreateApplicationDialogProps) {
  const createApp = useCreateApplication();
  const { data: programs = [] } = usePrograms();
  const { data: visaCategories = [] } = useVisaCategories();

  const { data: counselors = [] } = useQuery({
    queryKey: ['users', 'counselors', student.branch.id],
    queryFn: () =>
      api.get<CounselorOption[]>('/users', {
        roleCode: 'COUNSELOR',
        branchId: student.branch.id,
        status: 'ACTIVE',
        limit: 100,
      }),
    enabled: open,
  });

  const currentYear = new Date().getFullYear();

  const form = useForm<CreateApplicationFormValues>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      visaCategoryId: '',
      programId: '',
      schoolName: '',
      schoolCountry: 'Japan',
      intakeYear: currentYear + 1,
      intakeSession: 'NONE',
      assignedCounselorId: student.assignedCounselor?.id ?? '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        visaCategoryId: '',
        programId: '',
        schoolName: '',
        schoolCountry: 'Japan',
        intakeYear: currentYear + 1,
        intakeSession: 'NONE',
        assignedCounselorId: student.assignedCounselor?.id ?? '',
        notes: '',
      });
    }
  }, [open, student, currentYear, form]);

  async function onSubmit(values: CreateApplicationFormValues) {
    await createApp.mutateAsync({
      studentId: student.id,
      visaCategoryId: values.visaCategoryId,
      programId: values.programId,
      assignedCounselorId: values.assignedCounselorId,
      schoolOrCompany: {
        name: values.schoolName,
        country: values.schoolCountry,
      },
      intake: {
        year: values.intakeYear,
        session:
          values.intakeSession === 'NONE'
            ? undefined
            : (values.intakeSession as 'SPRING' | 'FALL' | 'WINTER' | 'SUMMER'),
      },
      notes: values.notes || undefined,
    });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Application</DialogTitle>
          <DialogDescription>
            For {student.personal.firstName} {student.personal.lastName} (
            {student.studentId})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visaCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Visa Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {visaCategories.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
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
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Program <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      School / Company Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Tokyo Language School" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="schoolCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="intakeYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Intake Year <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={currentYear}
                        max={currentYear + 5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intakeSession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">Not specified</SelectItem>
                        <SelectItem value="SPRING">Spring</SelectItem>
                        <SelectItem value="SUMMER">Summer</SelectItem>
                        <SelectItem value="FALL">Fall</SelectItem>
                        <SelectItem value="WINTER">Winter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assignedCounselorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Assigned Counselor <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select counselor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {counselors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.profile.firstName} {c.profile.lastName}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
                isLoading={createApp.isPending}
                loadingText="Creating…"
              >
                Create Application
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}