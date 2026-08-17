'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ClipboardCheck, QrCode, Pencil } from 'lucide-react';
import { useAttendance, useDailySummary } from '@/hooks/useAttendance';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { ManualAttendanceDialog } from '@/components/attendance/ManualAttendanceDialog';
import type { AttendanceStatus } from '@/lib/api/attendance';

const STATUS_VARIANTS: Record<string, 'success' | 'destructive' | 'warning' | 'muted'> = {
  PRESENT: 'success',
  ABSENT: 'destructive',
  LATE: 'warning',
  LEAVE: 'muted',
};

export default function AttendancePage() {
  const { user } = useAuth();
  const { has } = usePermissions();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]!,
  );
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | ''>('');
  const [manualOpen, setManualOpen] = useState(false);

  const canRecord = has(PERMISSION_CODES.RECORD_ATTENDANCE);
  const canScan = has(PERMISSION_CODES.SCAN_QR_ATTENDANCE);

  const { data: summary } = useDailySummary(
    user?.branch?.id,
    new Date(selectedDate).toISOString(),
  );

  const { data, isLoading } = useAttendance({
    date: new Date(selectedDate).toISOString(),
    status: statusFilter || undefined,
    limit: 100,
  });

  const records = data?.items ?? [];
  const studentSummary = summary?.STUDENT ?? {};
  const teacherSummary = summary?.TEACHER ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily attendance records and summaries
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canRecord && (
            <Button variant="outline" onClick={() => setManualOpen(true)}>
              <Pencil className="h-4 w-4" />
              Mark Manual
            </Button>
          )}
          {canScan && (
            <Link href="/attendance/scan">
              <Button variant="accent">
                <QrCode className="h-4 w-4" />
                Scan QR
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Date + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-[180px] h-9"
        />
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => {
            const val = v ?? '';
            setStatusFilter(val === 'all' ? '' : (val as AttendanceStatus));
          }}
        >
          <SelectTrigger className="h-9 w-[150px] text-sm">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PRESENT">Present</SelectItem>
            <SelectItem value="ABSENT">Absent</SelectItem>
            <SelectItem value="LATE">Late</SelectItem>
            <SelectItem value="LEAVE">Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Students Present
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-success">
              {studentSummary.PRESENT ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Students Absent
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">
              {studentSummary.ABSENT ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Teachers Present
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-success">
              {teacherSummary.PRESENT ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Students Late
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-warning">
              {studentSummary.LATE ?? 0}
            </p>
          </Card>
        </div>
      )}

      {/* Records Table */}
      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : records.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title="No records"
            description={`No attendance records for ${format(new Date(selectedDate), 'PPP')}.`}
            action={
              canRecord ? (
                <Button variant="accent" onClick={() => setManualOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Mark Manual Attendance
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.user.firstName} {r.user.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xxs">
                      {r.userType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.class?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {format(new Date(r.scannedAt), 'hh:mm a')}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge
                      variant={r.method === 'MANUAL' ? 'warning' : 'secondary'}
                      className="text-xxs"
                    >
                      {r.method === 'QR_SCAN' ? 'QR Scan' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[r.status] ?? 'muted'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Manual Attendance Dialog */}
      <ManualAttendanceDialog open={manualOpen} onOpenChange={setManualOpen} />
    </div>
  );
}