'use client';

import { format } from 'date-fns';
import { ClipboardList, CheckCircle, XCircle, Clock, MinusCircle } from 'lucide-react';
import { useOwnAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; variant: 'success' | 'destructive' | 'warning' | 'muted' }> = {
  PRESENT: { label: 'Present', icon: CheckCircle, variant: 'success' },
  ABSENT: { label: 'Absent', icon: XCircle, variant: 'destructive' },
  LATE: { label: 'Late', icon: Clock, variant: 'warning' },
  LEAVE: { label: 'Leave', icon: MinusCircle, variant: 'muted' },
};

export default function MyAttendancePage() {
  const { data: records = [], isLoading } = useOwnAttendance();

  if (isLoading) return <LoadingState fullPage message="Loading attendance…" />;

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const totalCount = records.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          My Account
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          My Attendance
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{totalCount}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Present</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-success">{presentCount}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Rate</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{attendanceRate}%</p>
        </Card>
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No attendance records"
            description="Your attendance will appear here once recorded."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const config = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PRESENT!;
            const Icon = config.icon;
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-5 w-5 shrink-0 text-${config.variant}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(r.date), 'EEEE, MMM dd, yyyy')}
                        </p>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.method === 'QR_SCAN' ? 'QR Scan' : 'Manual'} ·{' '}
                        {format(new Date(r.scannedAt), 'hh:mm a')}
                        {r.class && ` · ${r.class.name}`}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}