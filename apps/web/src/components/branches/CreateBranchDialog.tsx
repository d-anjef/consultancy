'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';

const schema = z.object({
  code: z.string().trim().min(2, 'Code required').max(20).toUpperCase(),
  name: z.string().trim().min(2, 'Name required').max(200),
  street: z.string().trim().min(1, 'Required'),
  city: z.string().trim().min(1, 'Required'),
  district: z.string().trim().min(1, 'Required'),
  province: z.string().trim().min(1, 'Required'),
  country: z.string().trim().default('Nepal'),
  phone: z.string().trim().min(7, 'Invalid phone'),
  email: z.string().email('Invalid email'),
  timezone: z.string().default('Asia/Kathmandu'),
});

type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBranchDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '', name: '',
      street: '', city: '', district: '', province: '',
      country: 'Nepal', phone: '', email: '',
      timezone: 'Asia/Kathmandu',
    },
  });

  const create = useMutation({
    mutationFn: (v: Values) =>
      api.post('/branches', {
        code: v.code,
        name: v.name,
        address: {
          street: v.street,
          city: v.city,
          district: v.district,
          province: v.province,
          country: v.country,
        },
        phone: v.phone,
        email: v.email,
        timezone: v.timezone,
      }),
    onSuccess: () => {
      toast.success('Branch created');
      qc.invalidateQueries({ queryKey: ['branches'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to create'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>New Branch</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Code *</FormLabel>
                <FormControl><Input placeholder="KTM01" {...field} /></FormControl>
                <FormMessage /></FormItem>)} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name *</FormLabel>
                <FormControl><Input placeholder="Kathmandu Main" {...field} /></FormControl>
                <FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="street" render={({ field }) => (
              <FormItem><FormLabel>Street *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage /></FormItem>)} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage /></FormItem>)} />
              <FormField control={form.control} name="district" render={({ field }) => (
                <FormItem><FormLabel>District *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage /></FormItem>)} />
              <FormField control={form.control} name="province" render={({ field }) => (
                <FormItem><FormLabel>Province *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone *</FormLabel>
                <FormControl><Input placeholder="+977..." {...field} /></FormControl>
                <FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email *</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage /></FormItem>)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" variant="accent" isLoading={create.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}