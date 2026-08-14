'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUpdateMyStudentProfile } from '@/hooks/useStudents';
import type { Student } from '@/lib/api/students';

const editSchema = z.object({
  phone: z.string().regex(/^(\+977)?[0-9]{7,10}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email'),
  alternatePhone: z
    .string()
    .regex(/^(\+977)?[0-9]{7,10}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  street: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100),
  province: z.string().trim().min(1).max(100),
  emergencyName: z.string().trim().min(1).max(200),
  emergencyRelationship: z.string().trim().min(1).max(50),
  emergencyPhone: z.string().regex(/^(\+977)?[0-9]{7,10}$/, 'Invalid phone number'),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditMyProfileDialogProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMyProfileDialog({
  student,
  open,
  onOpenChange,
}: EditMyProfileDialogProps) {
  const update = useUpdateMyStudentProfile();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      phone: student.contact.phone,
      email: student.contact.email,
      alternatePhone: student.contact.alternatePhone ?? '',
      street: student.contact.address.street,
      city: student.contact.address.city,
      district: student.contact.address.district,
      province: student.contact.address.province,
      emergencyName: student.emergencyContact.name,
      emergencyRelationship: student.emergencyContact.relationship,
      emergencyPhone: student.emergencyContact.phone,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        phone: student.contact.phone,
        email: student.contact.email,
        alternatePhone: student.contact.alternatePhone ?? '',
        street: student.contact.address.street,
        city: student.contact.address.city,
        district: student.contact.address.district,
        province: student.contact.address.province,
        emergencyName: student.emergencyContact.name,
        emergencyRelationship: student.emergencyContact.relationship,
        emergencyPhone: student.emergencyContact.phone,
      });
    }
  }, [open, student, form]);

  async function onSubmit(values: EditFormValues) {
    await update.mutateAsync({
      contact: {
        phone: values.phone,
        email: values.email,
        alternatePhone: values.alternatePhone || undefined,
        address: {
          street: values.street,
          city: values.city,
          district: values.district,
          province: values.province,
          country: student.contact.address.country,
        },
      },
      emergencyContact: {
        name: values.emergencyName,
        relationship: values.emergencyRelationship,
        phone: values.emergencyPhone,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Edit className="h-4 w-4 text-accent" />
            Edit Contact Information
          </DialogTitle>
          <DialogDescription>
            Update your contact and emergency contact details. Other information
            requires staff assistance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alternatePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternate Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Street Address <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Emergency Contact</h4>
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
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                isLoading={update.isPending}
                loadingText="Saving…"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}