'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  User as UserIcon,
  Phone,
  Mail,
  Building2,
  ShieldAlert,
  FileText,
  Edit,
} from 'lucide-react';
import { useMyStudentProfile } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Student Profile
          </p>
          <div className="mt-1 flex items-center gap-3">
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

        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Edit className="h-4 w-4" />
          Edit Contact Info
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
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
              <InfoField label="Nationality">{student.personal.nationality}</InfoField>
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
                {student.contact.address.street}, {student.contact.address.city},{' '}
                {student.contact.address.district}, {student.contact.address.province}
              </InfoField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-sm">
              <InfoField label="Name">{student.emergencyContact.name}</InfoField>
              <InfoField label="Relationship">
                {student.emergencyContact.relationship}
              </InfoField>
              <InfoField label="Phone">{student.emergencyContact.phone}</InfoField>
            </CardContent>
          </Card>

          {student.currentApplication && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Current Application
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="font-mono text-xs text-muted-foreground">
                  {student.currentApplication.applicationNumber}
                </div>
                <div className="mt-1 text-foreground">
                  Status: {student.currentApplication.status}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
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
                  {student.assignedCounselor.firstName}{' '}
                  {student.assignedCounselor.lastName}
                </InfoField>
              )}
            </CardContent>
          </Card>

          <Card className="border-accent/30 bg-accent-light">
            <CardHeader>
              <CardTitle className="text-sm">Need to update other info?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-foreground">
                For changes to your name, date of birth, or other official details,
                please contact your assigned counselor. You can only edit your
                contact information here.
              </p>
            </CardContent>
          </Card>
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
<PushSettingsCard />

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