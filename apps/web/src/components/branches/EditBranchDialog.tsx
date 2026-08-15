'use client';

import { useEffect } from 'react';
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

interface Branch {
  id: string;
  code: string;
  name: string;
  address: {
    street: string;
    city: string;
    district: string;
    province: string;
    country: string;
  };
  phone: string;
  email: string;
  isActive: boolean;
}

const schema = z.object({
  name: z.string().trim().min(2).max(200),
  street: z.string().trim().min(1),
  city: z.string().trim().min(1),
  district: z.string().trim().min(1),
  province: z.string().trim().min(1),
  phone: z.string().trim().min(7),
  email: z.string().email(),
});

type Values = z.infer<typeof schema>;

interface Props {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBranchDialog({ branch, open, onOpenChange }: Props) {
  const qc = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', street: '', city: '', district: '', province: '',
      phone: '', email: '',
    },
  });

  useEffect(() => {
    if (open && branch) {
      form.reset({
        name: branch.name,
        street: branch.address.street,
        city: branch.address.city,
        district: branch.address.district,
        province: branch.address.province,
        phone: branch.phone,
        email: branch.email,
      });
    }
  }, [open, branch, form]);

  const update = useMutation({
    mutationFn: (v: Values) =>
      api.patch(`/branches/${branch!.id}`, {
        name: v.name,
        address: {
          street: v.street,
          city: v.city,
          district: v.district,
          province: v.province,
          country: branch!.address.country,
        },
        phone: v.phone,
        email: v.email,
      }),
    onSuccess: () => {
      toast.success('Branch updated');
      qc.invalidateQueries({ queryKey: ['branches'] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to update'),
  });

  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Branch — {branch.code}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => update.mutate(v))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage /></FormItem>)} />

            <FormField control={form.control} name="street" render={({ field }) => (
              <FormItem><FormLabel>Street *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage /></FormItem>)} />

            <div className="grid grid-cols-3 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email *</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage /></FormItem>)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" variant="accent" isLoading={update.isPending}>Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}