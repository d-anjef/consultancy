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
import { useCreateStudent } from '@/hooks/useStudents';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/lib/api/endpoints/branches.api';
import { studentsApi } from '@/lib/api/students';
import type { Lead } from '@/lib/api/leads';

/* ─── Referrer Student Sub-Component ──────────────────────────────── */

function ReferrerStudentSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { data: studentsData } = useQuery({
    queryKey: ['students', 'for-referrer'],
    queryFn: () => studentsApi.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const students = studentsData?.items ?? [];

  return (
    <Select
      value={value || '__none__'}
      onValueChange={(v) => onChange(v === '__none__' ? '' : v)}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="None" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="__none__">— None —</SelectItem>
        {students.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.personal.firstName} {s.personal.lastName} ({s.studentId})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ─── Schema ─────────────────────────────────────────────────────── */

const createStudentSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  middleName: z.string().trim().max(100).optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  nationality: z.string().trim().min(1).default('Nepali'),
  fatherName: z.string().trim().max(100).optional().or(z.literal('')),
  motherName: z.string().trim().max(100).optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^(\+977)?[0-9]{7,10}$/, 'Invalid Nepali phone number'),
  email: z.string().email('Invalid email address'),
  street: z.string().trim().min(1, 'Street is required').max(200),
  city: z.string().trim().min(1, 'City is required').max(100),
  district: z.string().trim().min(1, 'District is required').max(100),
  province: z.string().trim().min(1, 'Province is required').max(100),
  emergencyName: z.string().trim().min(1, 'Emergency contact name required').max(200),
  emergencyRelationship: z.string().trim().min(1, 'Relationship required').max(50),
  emergencyPhone: z
    .string()
    .regex(/^(\+977)?[0-9]{7,10}$/, 'Invalid phone number'),
  referredByStudentId: z.string().optional().or(z.literal('')),
  referredByName: z.string().trim().max(200).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

type CreateStudentFormValues = z.infer<typeof createStudentSchema>;

/* ─── Props ──────────────────────────────────────────────────────── */

interface CreateStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill from an existing lead (converts lead → student) */
  fromLead?: Lead | null;
}

/* ─── Component ──────────────────────────────────────────────────── */

export function CreateStudentDialog({
  open,
  onOpenChange,
  fromLead,
}: CreateStudentDialogProps) {
  const { user } = useAuth();
  const createStudent = useCreateStudent();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', 'active'],
    queryFn: () => branchesApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      branchId: user?.branch?.id ?? '',
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      gender: 'MALE',
      nationality: 'Nepali',
      fatherName: '',
      motherName: '',
      phone: '',
      email: '',
      street: '',
      city: '',
      district: '',
      province: 'Bagmati',
      emergencyName: '',
      emergencyRelationship: '',
      emergencyPhone: '',
      referredByStudentId: '',
      referredByName: '',
      notes: '',
    },
  });

  // Pre-fill from lead when opened
  useEffect(() => {
    if (open && fromLead) {
      form.reset({
        branchId: fromLead.branch.id,
        firstName: fromLead.personal.firstName,
        lastName: fromLead.personal.lastName,
        middleName: '',
        dateOfBirth: '',
        gender: 'MALE',
        nationality: 'Nepali',
        fatherName: '',
        motherName: '',
        phone: fromLead.personal.phone,
        email: fromLead.personal.email ?? '',
        street: '',
        city: '',
        district: '',
        province: 'Bagmati',
        emergencyName: '',
        emergencyRelationship: '',
        emergencyPhone: '',
        referredByStudentId: '',
        referredByName: '',
        notes: fromLead.notes ?? '',
      });
    }
  }, [open, fromLead, form]);

  async function onSubmit(values: CreateStudentFormValues) {
    await createStudent.mutateAsync({
      branchId: values.branchId,
      fromLeadId: fromLead?.id,
      personal: {
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || undefined,
        dateOfBirth: new Date(values.dateOfBirth).toISOString(),
        gender: values.gender,
        nationality: values.nationality,
        fatherName: values.fatherName || undefined,
        motherName: values.motherName || undefined,
      },
      contact: {
        phone: values.phone,
        email: values.email,
        address: {
          street: values.street,
          city: values.city,
          district: values.district,
          province: values.province,
          country: 'Nepal',
        },
      },
      emergencyContact: {
        name: values.emergencyName,
        relationship: values.emergencyRelationship,
        phone: values.emergencyPhone,
      },
      referredBy: values.referredByStudentId || undefined,
referralRelationship: values.referredByName || undefined,
      notes: values.notes || undefined,
      sendInvitation: true,
    } );

    form.reset();
    onOpenChange(false);
  }

  const isOrgWide = user?.role.code === 'SUPER_ADMIN' || user?.role.code === 'ADMIN';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fromLead ? `Convert Lead to Student` : 'Register New Student'}
          </DialogTitle>
          {fromLead && (
            <DialogDescription>
              Converting {fromLead.leadNumber} — {fromLead.personal.firstName}{' '}
              {fromLead.personal.lastName}
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Branch */}
            {isOrgWide && !fromLead && (
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Branch <span className="text-destructive">*</span>
                    </FormLabel>
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

            {/* Personal Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Personal Information
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ram" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Prasad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Bahadur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date of Birth <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Gender <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
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
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother's Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+9779841234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="student@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Street Address <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Baneshwor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        City <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Kathmandu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        District <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Kathmandu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Province <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Bagmati" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Emergency Contact
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Relationship <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Father" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+9779841234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Referral */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Referral (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="referredByStudentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred by Student</FormLabel>
                      <ReferrerStudentSelect
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referredByName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Or Referrer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="External referrer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Select an existing student who referred, or type a name if not in
                the system.
              </p>
            </div>

            {/* Notes */}
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
                isLoading={createStudent.isPending}
                loadingText="Creating…"
              >
                {fromLead ? 'Convert to Student' : 'Create Student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}