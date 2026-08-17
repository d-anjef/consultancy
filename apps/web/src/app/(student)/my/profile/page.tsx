'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  User as UserIcon,
  Phone,
  Mail,
  Building2,
  ShieldAlert,
  FileText,
  Edit,
  UserCheck,
  QrCode,
  MapPin,
  TrendingUp,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { useMyStudentProfile } from '@/hooks/useStudents';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { StudentStatusBadge } from '@/components/students/StudentStatusBadge';
import { EditMyProfileDialog } from '@/components/students/EditMyProfileDialog';
import { PushSettingsCard } from '@/components/push/PushSettingsCard';

export default function MyProfilePage() {
  const { data: student, isLoading } = useMyStudentProfile();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <LoadingState fullPage message="Loading your profile…" />;

  if (!student) {
    return (
      <EmptyState
        icon={UserIcon}
        title="Profile not found"
        description="Your student profile could not be loaded. Please contact support."
      />
    );
  }

  // ─── Profile Completeness Calculator ───
  const totalFields = 14;
  const filledFields = [
    student.personal.dateOfBirth,
    student.personal.gender,
    student.personal.nationality,
    student.personal.maritalStatus,
    student.personal.fatherName,
    student.personal.motherName,
    student.contact.phone,
    student.contact.alternatePhone,
    student.contact.email,
    student.contact.address?.street,
    student.emergencyContact?.name,
    student.emergencyContact?.phone,
    student.assignedCounselor,
    student.currentApplication,
  ].filter(Boolean).length;

  const completeness = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Student Profile
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {student.personal.firstName} {student.personal.middleName}{' '}
              {student.personal.lastName}
            </h1>
            <StudentStatusBadge status={student.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {student.studentId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/my/qr"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <QrCode className="h-4 w-4" />
            My QR
          </Link>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4" />
            Edit Contact
          </Button>
        </div>
      </div>

      {/* ─── Profile Completeness Bar ─── */}
      <Card className="border-0 bg-neutral-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                Profile Completeness
              </p>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {completeness}%
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-accent transition-all duration-1000"
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 100 && (
            <p className="mt-2 text-xxs text-muted-foreground">
              Update your info to keep your profile up-to-date.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ═══ Left Column ═══ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="Date of Birth">
                {format(new Date(student.personal.dateOfBirth), 'PPP')}
              </InfoField>
              <InfoField label="Gender">{student.personal.gender}</InfoField>
              <InfoField label="Nationality">
                {student.personal.nationality}
              </InfoField>
              <InfoField label="Marital Status">
                {student.personal.maritalStatus || '—'}
              </InfoField>
              <InfoField label="Father's Name">
                {student.personal.fatherName || '—'}
              </InfoField>
              <InfoField label="Mother's Name">
                {student.personal.motherName || '—'}
              </InfoField>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Phone">{student.contact.phone}</InfoField>
                <InfoField label="Alternate Phone">
                  {student.contact.alternatePhone || '—'}
                </InfoField>
              </div>
              <InfoField label="Email">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {student.contact.email}
                </span>
              </InfoField>
              <InfoField label="Address">
                <span className="flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span>
                    {student.contact.address.street},{' '}
                    {student.contact.address.city},{' '}
                    {student.contact.address.district},{' '}
                    {student.contact.address.province}
                  </span>
                </span>
              </InfoField>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <InfoField label="Name">
                {student.emergencyContact.name}
              </InfoField>
              <InfoField label="Relationship">
                {student.emergencyContact.relationship}
              </InfoField>
              <InfoField label="Phone">
                {student.emergencyContact.phone}
              </InfoField>
            </CardContent>
          </Card>

          {/* Current Application */}
          {student.currentApplication && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Current Application
                </CardTitle>
                <Link
                  href="/my/application"
                  className={buttonVariants({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-7 px-2 text-xs',
                  })}
                >
                  View Details
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border bg-neutral-50/50 p-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {student.currentApplication.applicationNumber}
                    </div>
                    <div className="mt-1 font-medium text-foreground">
                      Application Status
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {student.currentApplication.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ═══ Right Column ═══ */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoField label="Branch">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {student.branch.name}
                </span>
              </InfoField>
              <InfoField label="Admission Date">
                {format(new Date(student.admissionDate), 'PPP')}
              </InfoField>
                            {student.assignedCounselor && (
                <InfoField label="Counselor">
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    {student.assignedCounselor.firstName}{' '}
                    {student.assignedCounselor.lastName}
                  </span>
                </InfoField>
              )}

              {/* ─── Referred By ─── */}
              {student.referredBy && (
                <InfoField label="Referred By">
                  <div>
                    <div className="text-foreground">
                      {student.referredBy.firstName}{' '}
                      {student.referredBy.lastName}
                    </div>
                    <div className="text-xxs text-muted-foreground font-mono">
                      {student.referredBy.studentId}
                    </div>
                  </div>
                </InfoField>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink
                href="/my/documents"
                icon={FileText}
                label="My Documents"
              />
              <QuickLink
                href="/my/fees"
                icon={Wallet}
                label="Fees & Payments"
              />
              <QuickLink
                href="/my/journey"
                icon={TrendingUp}
                label="My Journey"
              />
              <QuickLink
                href="/my/classes"
                icon={UserCheck}
                label="My Classes"
              />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-accent/30 bg-accent-light">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-accent-foreground" />
                Need to update other info?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-foreground leading-relaxed">
                For changes to your <strong>name</strong>,{' '}
                <strong>date of birth</strong>, or other official details,
                please contact your assigned counselor. You can only edit your
                contact information here.
              </p>
            </CardContent>
          </Card>

          {/* Push Settings */}
          <PushSettingsCard />
        </div>
      </div>

      <EditMyProfileDialog
        student={student}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function InfoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-all hover:border-accent/50 hover:bg-accent-light group"
    >
      <span className="flex items-center gap-2 text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
        <span className="font-medium">{label}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}