'use client';

import { FileText, Wallet, ClipboardList, Bell, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/data/constants';

export default function StudentDashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Student Portal
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Welcome, {user.profile.firstName}
        </h1>
      </div>

      {/* Application Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Application</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
            <p>No active application yet.</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Outstanding
              </p>
              <p className="text-lg font-bold tabular-nums text-foreground">Rs. 0</p>
            </div>
          </div>
          <Link href={ROUTES.MY_FEES}>
            <Button variant="outline" size="sm" className="w-full mt-2">
              View Fees
            </Button>
          </Link>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Attendance
              </p>
              <p className="text-lg font-bold tabular-nums text-foreground">—</p>
            </div>
          </div>
          <Link href={ROUTES.MY_ATTENDANCE}>
            <Button variant="outline" size="sm" className="w-full mt-2">
              View Attendance
            </Button>
          </Link>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Action Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Badge variant="success">All caught up</Badge>
            <p className="mt-3">No pending actions.</p>
          </div>
        </CardContent>
      </Card>

      {/* QR Access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Your Attendance QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Show your QR code to your teacher to mark attendance.
          </p>
          <Link href={ROUTES.MY_QR}>
            <Button variant="accent" size="sm">
              Show My QR
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}