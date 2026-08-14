'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
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
import { useCreateJourney } from '@/hooks/useJourney';
import { useVisaCategories } from '@/hooks/useVisaCategories';
import type { Student } from '@/lib/api/students';

const schema = z.object({
  visaCategoryId: z.string().min(1, 'Select a visa category'),
});

type FormValues = z.infer<typeof schema>;

interface StartJourneyDialogProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartJourneyDialog({
  student,
  open,
  onOpenChange,
}: StartJourneyDialogProps) {
  const create = useCreateJourney();
  const { data: visaCategories = [] } = useVisaCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      visaCategoryId: '',
    },
  });

  async function onSubmit(values: FormValues) {
    await create.mutateAsync({
      studentId: student.id,
      visaCategoryId: values.visaCategoryId,
    });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-accent" />
            Start Journey
          </DialogTitle>
          <DialogDescription>
            Create a milestone tracker for {student.personal.firstName}{' '}
            {student.personal.lastName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <SelectValue placeholder="Select visa type" />
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

            <p className="text-xs text-muted-foreground">
              This will create milestones based on the template for the selected visa
              category. A template must exist for this visa type.
            </p>

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
                loadingText="Starting…"
              >
                Start Journey
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}