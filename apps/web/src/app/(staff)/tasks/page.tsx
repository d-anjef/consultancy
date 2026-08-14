'use client';

import { useState } from 'react';
import { format, formatDistance, isPast } from 'date-fns';
import { Plus, ListTodo, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';
import { useTasks, useTaskCounts, useCompleteTask, useCancelTask } from '@/hooks/useTasks';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'border-l-destructive',
  HIGH: 'border-l-destructive/60',
  MEDIUM: 'border-l-accent',
  LOW: 'border-l-muted-foreground/30',
};

const STATUS_VARIANTS: Record<string, 'success' | 'accent' | 'muted' | 'destructive'> = {
  OPEN: 'accent',
  IN_PROGRESS: 'accent',
  COMPLETED: 'success',
  CANCELLED: 'muted',
};

const TASK_TYPE_LABELS: Record<string, string> = {
  CALL: 'Call',
  MESSAGE: 'Message',
  DOCUMENT_REMINDER: 'Document Reminder',
  PAYMENT_REMINDER: 'Payment Reminder',
  COUNSELING_FOLLOWUP: 'Counseling Follow-up',
  APPLICATION_FOLLOWUP: 'Application Follow-up',
  OTHER: 'Other',
};

type TabFilter = 'all' | 'today' | 'overdue' | 'upcoming' | 'completed';

export default function TasksPage() {
  const { has } = usePermissions();
  const [tab, setTab] = useState<TabFilter>('all');

  const { data: counts } = useTaskCounts();

  const queryParams = {
    limit: 50,
    ...(tab === 'today' ? { today: true } : {}),
    ...(tab === 'overdue' ? { overdue: true } : {}),
    ...(tab === 'upcoming' ? { upcoming: true } : {}),
    ...(tab === 'completed' ? { status: 'COMPLETED' as const } : {}),
  };

  const { data, isLoading } = useTasks(queryParams);
  const tasks = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Follow-ups and reminders
          </p>
        </div>
      </div>

      {/* Counts */}
      {counts && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4 cursor-pointer hover:bg-secondary/50" onClick={() => setTab('today')}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Today</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{counts.today}</p>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-secondary/50" onClick={() => setTab('overdue')}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Overdue</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">{counts.overdue}</p>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-secondary/50" onClick={() => setTab('upcoming')}>
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Upcoming</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{counts.upcoming}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Active</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{counts.total}</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {(['all', 'today', 'overdue', 'upcoming', 'completed'] as TabFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition-colors capitalize',
                tab === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <LoadingState message="Loading tasks…" />
      ) : tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={ListTodo}
            title="No tasks"
            description={`No ${tab === 'all' ? '' : tab} tasks found.`}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: import('@/lib/api/tasks').Task }) {
  const complete = useCompleteTask(task.id);
  const cancel = useCancelTask(task.id);

  const isActive = task.status === 'OPEN' || task.status === 'IN_PROGRESS';

  return (
    <Card className={cn('border-l-4', PRIORITY_COLORS[task.priority] ?? 'border-l-border')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xxs text-muted-foreground">{task.taskNumber}</span>
              <Badge variant={STATUS_VARIANTS[task.status] ?? 'muted'} className="text-xxs">
                {task.status}
              </Badge>
              <Badge variant="outline" className="text-xxs">
                {task.priority}
              </Badge>
              <Badge variant="secondary" className="text-xxs">
                {TASK_TYPE_LABELS[task.taskType] ?? task.taskType}
              </Badge>
            </div>
            <h3 className={cn(
              'text-sm font-medium',
              task.status === 'COMPLETED' && 'line-through text-muted-foreground',
              task.status !== 'COMPLETED' && 'text-foreground',
            )}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xxs text-muted-foreground">
              <span>
                Assigned to: <span className="font-medium text-foreground">{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
              </span>
              <span>·</span>
              <span className={task.isOverdue ? 'text-destructive font-medium' : ''}>
                Due {formatDistance(new Date(task.dueDate), new Date(), { addSuffix: true })}
              </span>
            </div>
          </div>

          {isActive && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => complete.mutate(task.id)}
                isLoading={complete.isPending}
                title="Complete"
              >
                <CheckCircle2 className="h-4 w-4 text-success" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => cancel.mutate(task.id)}
                isLoading={cancel.isPending}
                title="Cancel"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}