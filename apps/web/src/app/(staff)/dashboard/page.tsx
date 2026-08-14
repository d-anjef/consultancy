'use client';

import {
  Users,
  UserPlus,
  FileText,
  Wallet,
  CalendarClock,
  ClipboardCheck,
  Files,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/shared/PermissionGuard/PermissionGuard';
import { PERMISSION_CODES } from '@consultancy/config';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const firstName = user.profile.firstName;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {user.branch?.name ?? 'Organization'}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening today.
        </p>
      </div>

      {/* Stats — Role-aware */}
      <PermissionGuard requireAny={[PERMISSION_CODES.VIEW_STUDENT, PERMISSION_CODES.VIEW_LEAD]}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PermissionGuard requires={[PERMISSION_CODES.VIEW_LEAD]}>
            <StatCard label="Total Leads" value="0" icon={UserPlus} />
          </PermissionGuard>
          <PermissionGuard requires={[PERMISSION_CODES.VIEW_STUDENT]}>
            <StatCard label="Active Students" value="0" icon={Users} />
          </PermissionGuard>
          <PermissionGuard requires={[PERMISSION_CODES.VIEW_APPLICATION]}>
            <StatCard label="Applications" value="0" icon={FileText} />
          </PermissionGuard>
          <PermissionGuard requires={[PERMISSION_CODES.VIEW_FINANCE]}>
            <StatCard label="Outstanding Fees" value="Rs. 0" icon={Wallet} />
          </PermissionGuard>
        </div>
      </PermissionGuard>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Counseling */}
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_COUNSELING]}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Today's Counseling
              </CardTitle>
              <Badge variant="muted">0</Badge>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-sm text-muted-foreground">
                No sessions scheduled for today.
              </div>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Pending Actions */}
        <PermissionGuard requireAny={[PERMISSION_CODES.VERIFY_DOCUMENT, PERMISSION_CODES.FINAL_APPROVE_DOCUMENT]}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Pending Actions
              </CardTitle>
              <Badge variant="warning">0</Badge>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-sm text-muted-foreground">
                All caught up — no pending actions.
              </div>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>

      {/* Overdue Payments Alert */}
      <PermissionGuard requires={[PERMISSION_CODES.VIEW_FINANCE]}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent" />
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-sm text-muted-foreground">
              No overdue payments.
            </div>
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* System Info (SA only) */}
      <PermissionGuard requires={[PERMISSION_CODES.VIEW_HEALTH]}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Files className="h-4 w-4" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Organization</span>
              <span className="font-medium text-foreground">Chiba Education Center</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Role</span>
              <span className="font-medium text-foreground">{user.role.displayName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Permissions</span>
              <span className="font-medium text-foreground tabular-nums">
                {user.role.permissions.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </PermissionGuard>
    </div>
  );
}