'use client';

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
import { useCreateLead } from '@/hooks/useLeads';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/lib/api/endpoints/branches.api';
import type { LeadSource } from '@/lib/api/leads';

const createLeadSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  // Personal
  firstName: z.string().trim().min(1, 'Required').max(100),
  middleName: z.string().trim().max(100).optional().or(z.literal('')),
  lastName: z.string().trim().min(1, 'Required').max(100),
  phone: z.string().regex(/^(\+977)?[0-9]{7,10}$/, 'Invalid phone'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NONE']).default('NONE'),
  dateOfBirth: z.string().optional().or(z.literal('')),
  occupation: z.string().trim().max(200).optional().or(z.literal('')),
  // Address
  permanentAddress: z.string().trim().max(500).optional().or(z.literal('')),
  presentAddress: z.string().trim().max(500).optional().or(z.literal('')),
  // Education
  lastEducation: z.enum(['10+2', 'BACHELOR', 'MASTER', 'OTHER', 'NONE']).default('NONE'),
  faculty: z.string().trim().max(200).optional().or(z.literal('')),
  japaneseLanguageHistory: z.enum(['YES', 'NO', 'NONE']).default('NONE'),
  japanesePassedYear: z.string().trim().max(20).optional().or(z.literal('')),
  japaneseInstitute: z.string().trim().max(300).optional().or(z.literal('')),
  // Preference
  preferredCollege: z.string().trim().max(300).optional().or(z.literal('')),
  periodOfStudy: z.string().trim().max(100).optional().or(z.literal('')),
  preferredIntake: z.enum(['APRIL', 'JULY', 'OCTOBER', 'JANUARY', 'NONE']).default('NONE'),
  previousVisaApply: z.enum(['YES', 'NO', 'NONE']).default('NONE'),
  // Family
  fatherName: z.string().trim().max(200).optional().or(z.literal('')),
  fatherPhone: z.string().trim().max(20).optional().or(z.literal('')),
  motherName: z.string().trim().max(200).optional().or(z.literal('')),
  motherPhone: z.string().trim().max(20).optional().or(z.literal('')),
  // Source + Notes
  source: z.enum([
    'WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'MESSENGER',
    'WALK_IN', 'REFERRAL', 'PHONE', 'GOOGLE_FORM', 'OTHER',
  ]),
  referredBy: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof createLeadSchema>;

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'MESSENGER', label: 'Messenger' },
  { value: 'GOOGLE_FORM', label: 'Google Form' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'OTHER', label: 'Other' },
];

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLeadDialog({ open, onOpenChange }: CreateLeadDialogProps) {
  const { user } = useAuth();
  const createLead = useCreateLead();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', 'active'],
    queryFn: () => branchesApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      branchId: user?.branch?.id ?? '',
      firstName: '', middleName: '', lastName: '',
      phone: '', email: '',
      gender: 'NONE', dateOfBirth: '', occupation: '',
      permanentAddress: '', presentAddress: '',
      lastEducation: 'NONE', faculty: '',
      japaneseLanguageHistory: 'NONE', japanesePassedYear: '', japaneseInstitute: '',
      preferredCollege: '', periodOfStudy: '',
      preferredIntake: 'NONE', previousVisaApply: 'NONE',
      fatherName: '', fatherPhone: '', motherName: '', motherPhone: '',
      source: 'WALK_IN', referredBy: '', notes: '',
    },
  });

  const sourceValue = form.watch('source');
  const japaneseHistory = form.watch('japaneseLanguageHistory');
  const isOrgWide = user?.role.code === 'SUPER_ADMIN' || user?.role.code === 'ADMIN';

  async function onSubmit(v: FormValues) {
    await createLead.mutateAsync({
      branchId: v.branchId,
      personal: {
        firstName: v.firstName,
        lastName: v.lastName,
        middleName: v.middleName || undefined,
        phone: v.phone,
        email: v.email || undefined,
        gender: v.gender === 'NONE' ? undefined : v.gender,
        dateOfBirth: v.dateOfBirth ? new Date(v.dateOfBirth).toISOString() : undefined,
        occupation: v.occupation || undefined,
      },
      address: (v.permanentAddress || v.presentAddress) ? {
        permanentAddress: v.permanentAddress || undefined,
        presentAddress: v.presentAddress || undefined,
      } : undefined,
      education: (v.lastEducation !== 'NONE' || v.faculty || v.japaneseLanguageHistory !== 'NONE') ? {
        lastEducation: v.lastEducation === 'NONE' ? undefined : v.lastEducation,
        faculty: v.faculty || undefined,
        japaneseLanguageHistory: v.japaneseLanguageHistory === 'YES' ? true : v.japaneseLanguageHistory === 'NO' ? false : undefined,
        japanesePassedYear: v.japanesePassedYear || undefined,
        japaneseInstitute: v.japaneseInstitute || undefined,
      } : undefined,
      preference: (v.preferredCollege || v.preferredIntake !== 'NONE' || v.previousVisaApply !== 'NONE') ? {
        preferredCollege: v.preferredCollege || undefined,
        periodOfStudy: v.periodOfStudy || undefined,
        preferredIntake: v.preferredIntake === 'NONE' ? undefined : v.preferredIntake,
        previousVisaApply: v.previousVisaApply === 'YES' ? true : v.previousVisaApply === 'NO' ? false : undefined,
      } : undefined,
      family: (v.fatherName || v.motherName) ? {
        fatherName: v.fatherName || undefined,
        fatherPhone: v.fatherPhone || undefined,
        motherName: v.motherName || undefined,
        motherPhone: v.motherPhone || undefined,
      } : undefined,
      source: v.source,
      sourceMetadata: v.source === 'REFERRAL' && v.referredBy ? { referredBy: v.referredBy } : undefined,
      notes: v.notes || undefined,
    });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Lead — Enquiry Form</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Branch */}
            {isOrgWide && (
              <FormField control={form.control} name="branchId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {branches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* ─── Personal Information ─── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Given (First) Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="Ram" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="middleName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl><Input placeholder="Prasad" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Family (Surname) Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="Bahadur" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">—</SelectItem>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="occupation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl><Input placeholder="Student" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="previousVisaApply" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Visa for Japan?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">—</SelectItem>
                        <SelectItem value="YES">Yes</SelectItem>
                        <SelectItem value="NO">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tel No. <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="+9779841234567" type="tel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="email@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* ─── Address ─── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Address
              </h3>
              <FormField control={form.control} name="permanentAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Permanent Address</FormLabel>
                  <FormControl><Input placeholder="Village, District, Province" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="presentAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Present Address</FormLabel>
                  <FormControl><Input placeholder="Kathmandu, Nepal" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* ─── Education ─── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Education
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="lastEducation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Education</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">—</SelectItem>
                        <SelectItem value="10+2">10+2</SelectItem>
                        <SelectItem value="BACHELOR">Bachelor</SelectItem>
                        <SelectItem value="MASTER">Master</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="faculty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty</FormLabel>
                    <FormControl><Input placeholder="Management, Science, etc." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="japaneseLanguageHistory" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Japanese Language History?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">—</SelectItem>
                        <SelectItem value="YES">Yes</SelectItem>
                        <SelectItem value="NO">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {japaneseHistory === 'YES' && (
                  <>
                    <FormField control={form.control} name="japanesePassedYear" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passed Year</FormLabel>
                        <FormControl><Input placeholder="2025" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="japaneseInstitute" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institute Name</FormLabel>
                        <FormControl><Input placeholder="Tokyo Language School" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}
              </div>
            </div>

            {/* ─── Preference ─── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Preference
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="preferredCollege" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred College or City</FormLabel>
                    <FormControl><Input placeholder="Tokyo, Osaka..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="periodOfStudy" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period of Study</FormLabel>
                    <FormControl><Input placeholder="2 years" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="preferredIntake" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Intake</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">—</SelectItem>
                        <SelectItem value="APRIL">April</SelectItem>
                        <SelectItem value="JULY">July</SelectItem>
                        <SelectItem value="OCTOBER">October</SelectItem>
                        <SelectItem value="JANUARY">January</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* ─── Family ─── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Family
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fatherName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fatherPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father Tel No.</FormLabel>
                    <FormControl><Input type="tel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="motherName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="motherPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother Tel No.</FormLabel>
                    <FormControl><Input type="tel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* ─── Source & Notes ─── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Source & Notes
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="source" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {SOURCES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {sourceValue === 'REFERRAL' && (
                  <FormField control={form.control} name="referredBy" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred By</FormLabel>
                      <FormControl><Input placeholder="Name of referrer" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="Any additional notes…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" isLoading={createLead.isPending} loadingText="Creating…">
                Create Lead
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}