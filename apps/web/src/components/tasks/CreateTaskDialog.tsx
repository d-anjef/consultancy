

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ListTodo, Search, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useCreateTask } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useStudents } from '@/hooks/useStudents';
import { useLeads } from '@/hooks/useLeads';
import { useApplications } from '@/hooks/useApplications';
import type { TaskType, TaskPriority } from '@/lib/api/tasks';

type EntityType = 'STUDENT' | 'LEAD' | 'APPLICATION';

const schema = z.object({
  entityType: z.enum(['LEAD', 'STUDENT', 'APPLICATION']),
  entityId: z.string().trim().min(1, 'Please select a target'),
  entityLabel: z.string(),
  taskType: z.enum([
    'CALL', 'MESSAGE', 'DOCUMENT_REMINDER', 'PAYMENT_REMINDER',
    'COUNSELING_FOLLOWUP', 'APPLICATION_FOLLOWUP', 'OTHER',
  ]),
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  assignedToId: z.string().min(1, 'Assign to someone'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().min(1, 'Due date is required'),
});

type FormValues = z.infer<typeof schema>;

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'CALL', label: 'Call' },
  { value: 'MESSAGE', label: 'Message' },
  { value: 'DOCUMENT_REMINDER', label: 'Document Reminder' },
  { value: 'PAYMENT_REMINDER', label: 'Payment Reminder' },
  { value: 'COUNSELING_FOLLOWUP', label: 'Counseling Follow-up' },
  { value: 'APPLICATION_FOLLOWUP', label: 'Application Follow-up' },
  { value: 'OTHER', label: 'Other' },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEntityType?: EntityType;
  defaultEntityId?: string;
  defaultEntityLabel?: string;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultEntityType,
  defaultEntityId,
  defaultEntityLabel,
}: CreateTaskDialogProps) {
  const create = useCreateTask();
  const { data: usersData } = useUsers({ limit: 100, status: 'ACTIVE' });
  const staff = (usersData?.items ?? []).filter((u) => u.role.code !== 'STUDENT');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]!;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entityType: defaultEntityType ?? 'STUDENT',
      entityId: defaultEntityId ?? '',
      entityLabel: defaultEntityLabel ?? '',
      taskType: 'CALL',
      title: '',
      description: '',
      assignedToId: '',
      priority: 'MEDIUM',
      dueDate: tomorrowStr,
    },
  });

  const entityType = form.watch('entityType');
  const entityId = form.watch('entityId');
  const entityLabel = form.watch('entityLabel');

  useEffect(() => {
    if (open) {
      form.reset({
        entityType: defaultEntityType ?? 'STUDENT',
        entityId: defaultEntityId ?? '',
        entityLabel: defaultEntityLabel ?? '',
        taskType: 'CALL',
        title: '',
        description: '',
        assignedToId: '',
        priority: 'MEDIUM',
        dueDate: tomorrowStr,
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTypeChange(newType: EntityType) {
    form.setValue('entityType', newType);
    form.setValue('entityId', '');
    form.setValue('entityLabel', '');
  }

  function handleEntityPick(id: string, label: string) {
    form.setValue('entityId', id, { shouldValidate: true });
    form.setValue('entityLabel', label);
  }

  function clearEntity() {
    form.setValue('entityId', '');
    form.setValue('entityLabel', '');
  }

  async function onSubmit(values: FormValues) {
    await create.mutateAsync({
      relatedTo: {
        entityType: values.entityType,
        entityId: values.entityId,
      },
      taskType: values.taskType,
      title: values.title,
      description: values.description || undefined,
      assignedToId: values.assignedToId,
      priority: values.priority,
      dueDate: new Date(values.dueDate).toISOString(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ListTodo className="h-4 w-4 text-accent" />
            Create Task
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Related To <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(v) => handleTypeChange(v as EntityType)}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="APPLICATION">Application</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Select {entityType.toLowerCase()}{' '}
                <span className="text-destructive">*</span>
              </label>
              {entityId ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary/30 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entityLabel}
                    </p>
                    <p className="text-xxs font-mono text-muted-foreground truncate">
                      {entityId}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={clearEntity}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <EntitySearchInline
                  type={entityType}
                  onPick={handleEntityPick}
                />
              )}
              {form.formState.errors.entityId && (
                <p className="text-xs text-destructive mt-1.5">
                  {form.formState.errors.entityId.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Follow up on document submission" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taskType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
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
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Assign To <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staff.length === 0 ? (
                          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                            No active staff found
                          </div>
                        ) : (
                          staff.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.profile.firstName} {u.profile.lastName}
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Due Date <span className="text-destructive">*</span>
                    </FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional details…" {...field} />
                  </FormControl>
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
                loadingText="Creating…"
              >
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Inline searchable entity picker ----
function EntitySearchInline({
  type,
  onPick,
}: {
  type: EntityType;
  onPick: (id: string, label: string) => void;
}) {
  const [search, setSearch] = useState('');

  const { data: studentsData } = useStudents(
    type === 'STUDENT' ? { search: search || undefined, limit: 20 } : {},
  );
  const { data: leadsData } = useLeads(
    type === 'LEAD' ? { search: search || undefined, limit: 20 } : {},
  );
  const { data: appsData } = useApplications(
    type === 'APPLICATION' ? { limit: 20 } : {},
  );

  let items: { id: string; primary: string; secondary: string }[] = [];

  if (type === 'STUDENT') {
    items = (studentsData?.items ?? []).map((s) => ({
      id: s.id,
      primary: `${s.personal.firstName} ${s.personal.lastName}`,
      secondary: s.studentId,
    }));
  } else if (type === 'LEAD') {
    items = (leadsData?.items ?? []).map((l) => ({
      id: l.id,
      primary: `${l.personal.firstName} ${l.personal.lastName}`,
      secondary: l.leadNumber,
    }));
  } else if (type === 'APPLICATION') {
    const q = search.toLowerCase();
    items = (appsData?.items ?? [])
      .filter((a) => !q || a.applicationNumber.toLowerCase().includes(q))
      .map((a) => ({
        id: a.id,
        primary: a.applicationNumber,
        secondary: `${a.program.name} · ${a.visaCategory.name}`,
      }));
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${type.toLowerCase()}s by name or ID…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {search && (
        <div className="max-h-[200px] overflow-y-auto space-y-1 rounded-md border border-border p-1">
          {items.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No results.
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.id, item.primary)}
                className="w-full text-left flex items-center justify-between gap-2 rounded-md p-2 hover:bg-secondary/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {item.primary}
                  </div>
                  <div className="text-xxs font-mono text-muted-foreground truncate">
                    {item.secondary}
                  </div>
                </div>
                <Badge variant="outline" className="text-xxs shrink-0">
                  {type}
                </Badge>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}