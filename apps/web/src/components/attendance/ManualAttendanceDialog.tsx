'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  X,
  Clock,
  Coffee,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { classesApi } from '@/lib/api/classes';
import { attendanceApi, type AttendanceStatus } from '@/lib/api/attendance';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface StudentAttendance {
  studentId: string;      // Student's studentId (STU-XXXX)
  userId: string;         // User's _id (needed for API)
  firstName: string;
  lastName: string;
  status: AttendanceStatus | null;   // null = not yet marked
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualAttendanceDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]!,
  );
  const [notes, setNotes] = useState('');
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Fetch classes
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes', 'for-attendance'],
    queryFn: () => classesApi.list({ limit: 100, status: 'ACTIVE' }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const classes = classesData?.items ?? [];

  // Fetch selected class (with full student list)
  const { data: classDetail, isLoading: classDetailLoading } = useQuery({
    queryKey: ['class', selectedClassId, 'detail'],
    queryFn: () => classesApi.getById(selectedClassId),
    enabled: !!selectedClassId,
  });

  // When class loads, populate student list
  useEffect(() => {
    if (classDetail?.students) {
      setAttendance(
  classDetail.students.map((s) => ({
    studentId: s.studentId,
    userId: s.userId,
    firstName: s.firstName,
    lastName: s.lastName,
    status: null,
  })),
);
    }
  }, [classDetail]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedClassId('');
      setSelectedDate(new Date().toISOString().split('T')[0]!);
      setNotes('');
      setAttendance([]);
      setError(null);
      setSuccessCount(null);
      setIsSaving(false);
    }
  }, [open]);

  // Stats
  const stats = useMemo(() => {
    const marked = attendance.filter((a) => a.status !== null).length;
    const present = attendance.filter((a) => a.status === 'PRESENT').length;
    const absent = attendance.filter((a) => a.status === 'ABSENT').length;
    const late = attendance.filter((a) => a.status === 'LATE').length;
    const leave = attendance.filter((a) => a.status === 'LEAVE').length;
    return {
      total: attendance.length,
      marked,
      unmarked: attendance.length - marked,
      present,
      absent,
      late,
      leave,
    };
  }, [attendance]);

  // Handlers
  const setStatus = (userId: string, status: AttendanceStatus) => {
    setAttendance((prev) =>
      prev.map((a) => (a.userId === userId ? { ...a, status } : a)),
    );
  };

  const bulkSet = (status: AttendanceStatus) => {
    setAttendance((prev) => prev.map((a) => ({ ...a, status })));
  };

  const clearAll = () => {
    setAttendance((prev) => prev.map((a) => ({ ...a, status: null })));
  };

  // Save handler
  const handleSave = async () => {
    if (stats.marked === 0) {
      setError('Please mark attendance for at least one student.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const dateIso = new Date(selectedDate).toISOString();
    const toRecord = attendance.filter((a) => a.status !== null);

    const results = await Promise.allSettled(
      toRecord.map((student) =>
        attendanceApi.manual({
          userId: student.userId,
          userType: 'STUDENT',
          classId: selectedClassId,
          status: student.status!,
          date: dateIso,
          notes: notes || undefined,
        }),
      ),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Get error messages from failed ones
    const failedErrors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => {
        const err = r.reason as { message?: string };
        return err.message ?? 'Unknown error';
      });

    // Refresh queries
    qc.invalidateQueries({ queryKey: ['attendance'] });

    setIsSaving(false);
    setSuccessCount(successful);

    if (failed > 0) {
      // Deduplicate error messages
      const uniqueErrors = [...new Set(failedErrors)];
      setError(
        `${successful} recorded, ${failed} failed. ${
          uniqueErrors.includes('Attendance already recorded for this user on this date')
            ? 'Some students already have attendance for this date.'
            : uniqueErrors[0] || ''
        }`,
      );
    } else {
      // All successful — auto-close after 1.5s
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    }
  };

  const canSave = selectedClassId && stats.marked > 0 && !isSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mark Manual Attendance</DialogTitle>
          <DialogDescription>
            Record attendance for students who did not scan their QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* ─── Class & Date ─── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Class <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={classesLoading || isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground">
                      No active classes found
                    </div>
                  ) : (
                    classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{' '}
                        <span className="text-muted-foreground">
                          ({c.classCode})
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* ─── Class Info Card ─── */}
          {classDetail && (
            <div className="rounded-lg border border-border bg-neutral-50/50 p-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {classDetail.students.length}{' '}
                    {classDetail.students.length === 1 ? 'student' : 'students'}{' '}
                    enrolled
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Teacher: {classDetail.teacher.firstName}{' '}
                  {classDetail.teacher.lastName}
                </div>
              </div>
            </div>
          )}

          {/* ─── Student List ─── */}
          {classDetailLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : attendance.length > 0 ? (
            <>
              {/* Bulk actions */}
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/30 p-2">
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => bulkSet('PRESENT')}
                    disabled={isSaving}
                    className="h-7 text-xs"
                  >
                    <Check className="h-3 w-3" />
                    All Present
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => bulkSet('ABSENT')}
                    disabled={isSaving}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3" />
                    All Absent
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={clearAll}
                    disabled={isSaving}
                    className="h-7 text-xs text-muted-foreground"
                  >
                    Clear
                  </Button>
                </div>
                <div className="text-xxs text-muted-foreground">
                  {stats.marked}/{stats.total} marked
                </div>
              </div>

              {/* Student rows */}
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {attendance.map((student) => (
                  <StudentRow
                    key={student.userId}
                    student={student}
                    onStatusChange={(status) => setStatus(student.userId, status)}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </>
          ) : selectedClassId ? (
            <div className="rounded-lg border border-border bg-neutral-50/50 p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                No students enrolled in this class yet.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-neutral-50/50 p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                Select a class above to see enrolled students.
              </p>
            </div>
          )}

          {/* ─── Notes ─── */}
          {attendance.length > 0 && (
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="e.g. Class held remotely today"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSaving}
                maxLength={500}
              />
            </div>
          )}

          {/* ─── Error / Success ─── */}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {successCount !== null && !error && (
            <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 p-3">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <p className="text-sm text-success">
                Successfully recorded {successCount}{' '}
                {successCount === 1 ? 'attendance' : 'attendances'}.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-border">
          {/* Summary */}
          {stats.marked > 0 && (
            <div className="flex-1 flex items-center gap-2 text-xs">
              {stats.present > 0 && (
                <Badge variant="success" className="text-xxs">
                  {stats.present} Present
                </Badge>
              )}
              {stats.absent > 0 && (
                <Badge variant="destructive" className="text-xxs">
                  {stats.absent} Absent
                </Badge>
              )}
              {stats.late > 0 && (
                <Badge variant="warning" className="text-xxs">
                  {stats.late} Late
                </Badge>
              )}
              {stats.leave > 0 && (
                <Badge variant="secondary" className="text-xxs">
                  {stats.leave} Leave
                </Badge>
              )}
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={handleSave}
            disabled={!canSave}
            isLoading={isSaving}
            loadingText="Saving…"
          >
            Save Attendance ({stats.marked})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Student Row Component
// ═══════════════════════════════════════════════════════════════════

function StudentRow({
  student,
  onStatusChange,
  disabled,
}: {
  student: StudentAttendance;
  onStatusChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-colors',
        student.status
          ? 'border-border bg-white'
          : 'border-border bg-neutral-50/30',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {student.firstName} {student.lastName}
        </p>
        <p className="text-xxs text-muted-foreground font-mono">
          {student.studentId}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <StatusButton
          active={student.status === 'PRESENT'}
          onClick={() => onStatusChange('PRESENT')}
          disabled={disabled}
          icon={Check}
          label="P"
          activeClass="bg-success text-white border-success"
          title="Present"
        />
        <StatusButton
          active={student.status === 'ABSENT'}
          onClick={() => onStatusChange('ABSENT')}
          disabled={disabled}
          icon={X}
          label="A"
          activeClass="bg-destructive text-white border-destructive"
          title="Absent"
        />
        <StatusButton
          active={student.status === 'LATE'}
          onClick={() => onStatusChange('LATE')}
          disabled={disabled}
          icon={Clock}
          label="L"
          activeClass="bg-warning text-white border-warning"
          title="Late"
        />
        <StatusButton
          active={student.status === 'LEAVE'}
          onClick={() => onStatusChange('LEAVE')}
          disabled={disabled}
          icon={Coffee}
          label="Lv"
          activeClass="bg-neutral-600 text-white border-neutral-600"
          title="Leave"
        />
      </div>
    </div>
  );
}

function StatusButton({
  active,
  onClick,
  disabled,
  icon: Icon,
  label,
  activeClass,
  title,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ElementType;
  label: string;
  activeClass: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-8 w-9 items-center justify-center rounded-md border text-xs font-semibold transition-all',
        active
          ? activeClass
          : 'border-border bg-white text-muted-foreground hover:bg-secondary hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}