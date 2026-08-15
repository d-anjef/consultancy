'use client';

import { CheckCircle2, Circle, Clock, MinusCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  useStudentJourney,
  useCreateJourney,
  useUpdateMilestoneStatus,
} from '@/hooks/useJourney';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import type { MilestoneStatus } from '@/lib/api/journey';

interface Props {
  studentId: string;
  canEdit?: boolean;
}

const STATUS_ICONS: Record<MilestoneStatus, { icon: React.ElementType; color: string }> = {
  NOT_STARTED: { icon: Circle, color: 'text-muted-foreground' },
  IN_PROGRESS: { icon: Clock, color: 'text-yellow-600' },
  COMPLETED: { icon: CheckCircle2, color: 'text-green-600' },
  SKIPPED: { icon: MinusCircle, color: 'text-muted-foreground' },
};

export function StudentJourneyPanel({ studentId, canEdit = true }: Props) {
  const { data: journey, isLoading } = useStudentJourney(studentId);
  const createJourney = useCreateJourney();

  async function initJourney() {
    try {
      await createJourney.mutateAsync({ studentId });
      toast.success('Journey initialized');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to initialize');
    }
  }

  if (isLoading) return <LoadingState message="Loading journey…" />;

  if (!journey) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">No journey yet</p>
            <p className="text-sm text-muted-foreground">
              Initialize milestones based on student's visa category
            </p>
          </div>
          {canEdit && (
            <Button
              variant="accent"
              onClick={initJourney}
              isLoading={createJourney.isPending}
            >
              Initialize Journey
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const sorted = [...journey.milestones].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Journey Progress
            </CardTitle>
            <Badge variant="accent">
              {journey.completedCount} / {journey.totalRequired}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={journey.overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {journey.overallProgress}% complete · {journey.visaCategory.name}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.map((m) => (
            <MilestoneRow
              key={m.key}
              milestone={m}
              journeyId={journey.id}
              canEdit={canEdit}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MilestoneRow({
  milestone,
  journeyId,
  canEdit,
}: {
  milestone: any;
  journeyId: string;
  canEdit: boolean;
}) {
  const updateStatus = useUpdateMilestoneStatus(journeyId);
  const cfg = STATUS_ICONS[milestone.status as MilestoneStatus];
  const Icon = cfg.icon;

  async function changeStatus(status: MilestoneStatus) {
    try {
      await updateStatus.mutateAsync({ milestoneKey: milestone.key, status });
      toast.success('Milestone updated');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update');
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{milestone.title}</p>
          {milestone.description && (
            <p className="text-xs text-muted-foreground truncate">
              {milestone.description}
            </p>
          )}
        </div>
        {!milestone.isRequired && (
          <Badge variant="outline" className="text-xxs shrink-0">
            Optional
          </Badge>
        )}
      </div>

      {canEdit ? (
        <Select
          value={milestone.status}
          onValueChange={(v) => changeStatus(v as MilestoneStatus)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="SKIPPED">Skipped</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Badge variant="outline">{milestone.status.replace('_', ' ')}</Badge>
      )}
    </div>
  );
}