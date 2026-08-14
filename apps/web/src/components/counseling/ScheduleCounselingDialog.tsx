'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ScheduleCounselingDialogProps {
  leadId: string;
  branchId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ScheduleCounselingDialog({
  open,
  onOpenChange,
}: ScheduleCounselingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Counseling</DialogTitle>
          <DialogDescription>
            Select date, time, and counselor for this session.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center text-sm text-muted-foreground">
          Please use the Counseling page to schedule a full session.
          Quick-schedule from lead page is coming soon.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}