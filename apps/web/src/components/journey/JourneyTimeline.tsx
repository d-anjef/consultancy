'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Check, Circle, PlayCircle, MinusCircle, Edit, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  StudentJourney,
  StudentMilestone,
  MilestoneStatus,
} from '@/lib/api/journey';
import { useUpdateMilestoneStatus } from '@/hooks/useJourney';

interface JourneyTimelineProps {
  journey: StudentJourney;
  editable?: boolean;
}

export function JourneyTimeline({ journey, editable = false }: JourneyTimelineProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<MilestoneStatus>('NOT_STARTED');
  const [editNotes, setEditNotes] = useState('');

  const update = useUpdateMilestoneStatus(journey.id);

  function startEdit(m: StudentMilestone) {
    setEditingKey(m.key);
    setEditStatus(m.status);
    setEditNotes(m.notes ?? '');
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditStatus('NOT_STARTED');
    setEditNotes('');
  }

  async function saveEdit(milestoneKey: string) {
    await update.mutateAsync({
      milestoneKey,
      status: editStatus,
      notes: editNotes || undefined,
    });
    cancelEdit();
  }

  return (
    <div className="relative">
      {/* Progress bar */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">Overall Progress</p>
          <p className="text-sm font-bold tabular-nums text-foreground">
            {journey.completedCount} / {journey.totalRequired}
          </p>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${journey.overallProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-right tabular-nums">
          {journey.overallProgress}% complete
        </p>
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

        <ul className="space-y-6">
          {journey.milestones.map((m) => {
            const isCurrent = journey.currentMilestone?.key === m.key;
            const isEditing = editingKey === m.key;

            return (
              <li key={m.key} className="relative">
                <MilestoneDot status={m.status} isCurrent={isCurrent} />

                <div
                  className={cn(
                    'rounded-lg border p-4 transition-colors',
                    isCurrent
                      ? 'border-accent bg-accent-light/30'
                      : m.status === 'COMPLETED'
                      ? 'border-success/30 bg-success/5'
                      : 'border-border bg-card',
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            'text-sm font-semibold',
                            m.status === 'COMPLETED' && 'line-through text-muted-foreground',
                            m.status !== 'COMPLETED' && 'text-foreground',
                          )}
                        >
                          {m.title}
                        </h3>
                        {isCurrent && !isEditing && (
                          <span className="text-xxs uppercase tracking-wider font-bold text-accent-foreground bg-accent-light px-1.5 py-0.5 rounded">
                            You are here
                          </span>
                        )}
                        {!m.isRequired && (
                          <span className="text-xxs uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                            Optional
                          </span>
                        )}
                      </div>
                      {m.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {m.description}
                        </p>
                      )}
                    </div>

                    {editable && !isEditing && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEdit(m)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Edit mode */}
                  {isEditing ? (
                    <div className="space-y-3 mt-3">
                      <Select
                        value={editStatus}
                        onValueChange={(v) => setEditStatus(v as MilestoneStatus)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="SKIPPED">Skipped</SelectItem>
                        </SelectContent>
                      </Select>

                      <Textarea
                        placeholder="Notes (optional)"
                        rows={2}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="text-sm"
                      />

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => saveEdit(m.key)}
                          isLoading={update.isPending}
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {m.estimatedDays && m.status !== 'COMPLETED' && (
                          <span>Est. {m.estimatedDays} days</span>
                        )}
                        {m.startedAt && (
                          <span>
                            Started {format(new Date(m.startedAt), 'MMM dd, yyyy')}
                          </span>
                        )}
                        {m.completedAt && (
                          <span className="text-success font-medium">
                            ✓ {format(new Date(m.completedAt), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>

                      {m.notes && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {m.notes}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function MilestoneDot({
  status,
  isCurrent,
}: {
  status: MilestoneStatus;
  isCurrent: boolean;
}) {
  const Icon =
    status === 'COMPLETED'
      ? Check
      : status === 'IN_PROGRESS'
      ? PlayCircle
      : status === 'SKIPPED'
      ? MinusCircle
      : Circle;

  return (
    <div
      className={cn(
        'absolute -left-8 top-4 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background',
        status === 'COMPLETED' && 'bg-success text-success-foreground',
        status === 'IN_PROGRESS' && 'bg-accent text-accent-foreground',
        status === 'SKIPPED' && 'bg-muted text-muted-foreground',
        status === 'NOT_STARTED' &&
          (isCurrent ? 'bg-accent-light text-accent-foreground border-2 border-accent' : 'bg-secondary text-muted-foreground'),
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
    </div>
  );
}