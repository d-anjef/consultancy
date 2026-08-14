'use client';

import { Archive } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useArchiveStudent } from '@/hooks/useStudents';
import type { Student } from '@/lib/api/students';

interface ArchiveStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveStudentDialog({
  student,
  open,
  onOpenChange,
}: ArchiveStudentDialogProps) {
  const archive = useArchiveStudent(student?.id ?? '');

  async function onConfirm() {
    await archive.mutateAsync();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Archive className="h-4 w-4 text-destructive" />
            Archive Student
          </DialogTitle>
          {student && (
            <DialogDescription>
              Archive {student.personal.firstName} {student.personal.lastName} (
              {student.studentId})? This student will no longer appear in active
              lists.
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={archive.isPending}
            loadingText="Archiving…"
          >
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}