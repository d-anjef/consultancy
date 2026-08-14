'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateRole } from '@/hooks/useRoles';
import { usePermissionsGrouped } from '@/hooks/usePermissionsList';
import { PermissionCheckboxGroup } from './PermissionCheckboxGroup';

const schema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z_]+$/, 'Only uppercase letters and underscores')
    .min(3)
    .max(50),
  displayName: z.string().trim().min(1, 'Required').max(100),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
  const create = useCreateRole();
  const { data: grouped = {} } = usePermissionsGrouped();
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      displayName: '',
      description: '',
    },
  });

  function togglePermission(code: string) {
    const next = new Set(selectedCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelectedCodes(next);
  }

  function selectAll(codes: string[]) {
    const next = new Set(selectedCodes);
    codes.forEach((c) => next.add(c));
    setSelectedCodes(next);
  }

  function deselectAll(codes: string[]) {
    const next = new Set(selectedCodes);
    codes.forEach((c) => next.delete(c));
    setSelectedCodes(next);
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    if (selectedCodes.size === 0) {
      setError('Please select at least one permission');
      return;
    }

    try {
      await create.mutateAsync({
        code: values.code,
        displayName: values.displayName,
        description: values.description || undefined,
        permissions: Array.from(selectedCodes),
      });
      form.reset();
      setSelectedCodes(new Set());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Create Custom Role
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Role Code <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="SENIOR_COUNSELOR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Display Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Counselor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Permissions <span className="text-destructive">*</span>
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {selectedCodes.size} selected
                </span>
              </div>

              {error && (
                <p className="mb-3 text-sm text-destructive">{error}</p>
              )}

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {Object.entries(grouped)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, perms]) => (
                    <PermissionCheckboxGroup
                      key={category}
                      category={category}
                      permissions={perms}
                      selectedCodes={selectedCodes}
                      onToggle={togglePermission}
                      onSelectAll={selectAll}
                      onDeselectAll={deselectAll}
                    />
                  ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedCodes(new Set());
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
                Create Role
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}