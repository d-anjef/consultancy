'use client';

import { useState } from 'react';
import { Zap, Check, ArrowRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useChangeApplicationStatus } from '@/hooks/useApplications';
import type { Application, ApplicationStatus } from '@/lib/api/applications';

/**
 * Ordered pipeline of statuses in the normal flow.
 * QuickComplete walks the app through these until it reaches target.
 */
const STATUS_PIPELINE: ApplicationStatus[] = [
  'DRAFT',
  'REGISTERED',
  'DOCUMENT_COLLECTION',
  'DOCUMENT_REVIEW',
  'DOCUMENT_VERIFICATION',
  'FINAL_APPROVAL',
  'SUBMITTED',
  'PROCESSING',
  'APPROVED',
  'COMPLETED',
];

const TARGET_OPTIONS: { value: ApplicationStatus; label: string; description: string }[] = [
  {
    value: 'SUBMITTED',
    label: 'Submitted',
    description: 'Fast-track all pre-submission steps and mark as submitted.',
  },
  {
    value: 'APPROVED',
    label: 'Approved',
    description: 'Fast-track through submission, processing, then approved.',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    description: 'Full completion — all steps to final state.',
  },
];

interface Props {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickCompleteDialog({ application, open, onOpenChange }: Props) {
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('APPROVED');
  const [reason, setReason] = useState('Fast-tracked via Quick Complete');
  const [progress, setProgress] = useState<string>('');

  const changeStatus = useChangeApplicationStatus(application?.id ?? '');

  if (!application) return null;

  const currentIdx = STATUS_PIPELINE.indexOf(application.status as ApplicationStatus);
  const targetIdx = STATUS_PIPELINE.indexOf(targetStatus);
  const canFastTrack = currentIdx >= 0 && targetIdx > currentIdx;

  const stepsToRun =
    canFastTrack ? STATUS_PIPELINE.slice(currentIdx + 1, targetIdx + 1) : [];

  async function handleFastTrack() {
    if (!application || stepsToRun.length === 0) return;

    setProgress(`Starting fast-track — ${stepsToRun.length} steps…`);

    let currentStep = 0;
    try {
      for (const nextStatus of stepsToRun) {
        currentStep++;
        setProgress(`Step ${currentStep}/${stepsToRun.length}: → ${nextStatus}`);
        await changeStatus.mutateAsync({
          status: nextStatus,
          reason: currentStep === stepsToRun.length ? reason : 'Auto-advanced (Quick Complete)',
        });
      }
      toast.success(`Application fast-tracked to ${targetStatus}!`);
      setProgress('');
      onOpenChange(false);
    } catch (e: any) {
      setProgress('');
      toast.error(
        `Failed at step ${currentStep}/${stepsToRun.length}: ${e?.message ?? 'Unknown error'}`,
      );
    }
  }

  const isRunning = changeStatus.isPending || !!progress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-yellow-500" />
            Quick Complete Application
          </DialogTitle>
          <DialogDescription>
            Fast-track this application by automatically running through multiple
            status transitions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current status display */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Current Status
            </div>
            <div className="font-medium text-foreground">{application.status}</div>
          </div>

          {/* Target selector */}
          <div className="space-y-2">
            <Label>Target Status</Label>
            <Select
              value={targetStatus}
              onValueChange={(v) => setTargetStatus(v as ApplicationStatus)}
              disabled={isRunning}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {TARGET_OPTIONS.find((o) => o.value === targetStatus)?.description}
            </p>
          </div>

          {/* Steps preview */}
          {canFastTrack ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <div className="flex items-start gap-2 text-xs">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-yellow-700 mt-0.5" />
                <div className="text-yellow-900">
                  <p className="font-medium mb-1">
                    Will run {stepsToRun.length} status transition
                    {stepsToRun.length !== 1 ? 's' : ''}:
                  </p>
                  <p className="font-mono text-[11px]">
                    {application.status} → {stepsToRun.join(' → ')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Cannot fast-track — current status is at or beyond target status.
                </span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Final Reason / Note</Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isRunning}
              placeholder="Reason recorded on final transition"
            />
          </div>

          {/* Progress */}
          {progress && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 text-xs text-blue-900">
                <div className="h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <span>{progress}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRunning}
          >
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={handleFastTrack}
            disabled={!canFastTrack || isRunning}
            isLoading={isRunning}
            loadingText="Fast-tracking…"
          >
            <Check className="h-4 w-4" />
            Fast-Track to {targetStatus}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}