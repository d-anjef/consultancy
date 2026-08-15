'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User as UserIcon,
  Phone,
  Mail,
  Building2,
  Archive,
  Plus,
  FileText,
  ShieldAlert,
  Files,
  MapPin,
  Upload,
  Download,
} from 'lucide-react';
import { useStudent } from '@/hooks/useStudents';
import { useApplications } from '@/hooks/useApplications';
import { useDocuments, downloadDocument } from '@/hooks/useDocuments';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { StudentStatusBadge } from '@/components/students/StudentStatusBadge';
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { TransferBranchDialog } from '@/components/students/TransferBranchDialog';
import { ArchiveStudentDialog } from '@/components/students/ArchiveStudentDialog';
import { CreateApplicationDialog } from '@/components/applications/CreateApplicationDialog';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { formatFileSize } from '@/lib/utils/currency';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { has } = usePermissions();

  const [transferOpen, setTransferOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [createAppOpen, setCreateAppOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);

  const { data: student, isLoading } = useStudent(id);
  const { data: appsData } = useApplications({ studentId: id, limit: 50 });
  const { data: docsData } = useDocuments({ studentId: id, limit: 50 });

  const canTransfer = has(PERMISSION_CODES.TRANSFER_STUDENT_BRANCH);
  const canArchive = has(PERMISSION_CODES.ARCHIVE_STUDENT);
  const canCreateApp = has(PERMISSION_CODES.CREATE_APPLICATION);
  const canUploadDoc = has(PERMISSION_CODES.UPLOAD_DOCUMENT);

  if (isLoading) return <LoadingState fullPage message="Loading student…" />;

  if (!student) {
    return (
      <EmptyState
        icon={UserIcon}
        title="Student not found"
        description="This student doesn't exist or you don't have permission to view."
        action={
          <Button variant="outline" onClick={() => router.push('/students')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
    );
  }

  const applications = appsData?.items ?? [];
  const documents = docsData?.items ?? [];
  const hasActiveApp = applications.some((a) => a.isActive);

  const studentFullName = `${student.personal.firstName} ${student.personal.lastName}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push('/students')}
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Students
          </button>
          <div className="flex items-center gap-3">
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

        <div className="flex flex-wrap gap-2 shrink-0">
          {canUploadDoc && (
            <Button variant="outline" onClick={() => setUploadDocOpen(true)}>
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          )}
          {canCreateApp && !hasActiveApp && (
            <Button variant="accent" onClick={() => setCreateAppOpen(true)}>
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/students/${student.id}/journey`)}
          >
            <MapPin className="h-4 w-4" />
            Journey
          </Button>
          {canTransfer && (
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <Building2 className="h-4 w-4" />
              Transfer
            </Button>
          )}
          {canArchive && student.status !== 'ARCHIVED' && (
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal */}
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

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Phone">{student.contact.phone}</InfoField>
                <InfoField label="Email">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {student.contact.email}
                  </span>
                </InfoField>
              </div>
              <InfoField label="Address">
                {student.contact.address.street}, {student.contact.address.city},{' '}
                {student.contact.address.district}, {student.contact.address.province}
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
            <CardContent className="grid grid-cols-3 gap-4 text-sm">
              <InfoField label="Name">{student.emergencyContact.name}</InfoField>
              <InfoField label="Relationship">
                {student.emergencyContact.relationship}
              </InfoField>
              <InfoField label="Phone">{student.emergencyContact.phone}</InfoField>
            </CardContent>
          </Card>

          {/* Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Applications ({applications.length})
              </CardTitle>
              {canCreateApp && !hasActiveApp && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCreateAppOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No applications yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => router.push(`/applications/${a.id}`)}
                      className="flex items-center justify-between gap-3 p-3 rounded-md border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-muted-foreground">
                          {a.applicationNumber}
                        </div>
                        <div className="font-medium text-sm text-foreground">
                          {a.program.name} — {a.visaCategory.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.schoolOrCompany.name} · Intake {a.intake.year}
                        </div>
                      </div>
                      <ApplicationStatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Files className="h-4 w-4" />
                Documents ({documents.length})
              </CardTitle>
              {canUploadDoc && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUploadDocOpen(true)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No documents uploaded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-md border border-border hover:bg-secondary/50 transition-colors"
                    >
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => router.push(`/documents/${d.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {d.documentName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <span className="font-mono">{d.documentType}</span>
                              {' · '}
                              {d.currentVersion?.file &&
                                formatFileSize(d.currentVersion.file.sizeBytes)}
                              {d.versionCount > 1 && (
                                <> · v{d.versionCount}</>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <DocumentStatusBadge status={d.status} />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadDocument(
                              d.id,
                              d.currentVersion.file.originalName,
                            );
                          }}
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {student.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {student.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoField label="Branch">{student.branch.name}</InfoField>
              <InfoField label="Login Email">{student.userEmail}</InfoField>
              <InfoField label="Account Status">{student.userStatus}</InfoField>
              <InfoField label="Admission Date">
                {format(new Date(student.admissionDate), 'PPP')}
              </InfoField>
              {student.assignedCounselor && (
                <InfoField label="Counselor">
                  {student.assignedCounselor.firstName}{' '}
                  {student.assignedCounselor.lastName}
                </InfoField>
              )}
              {student.originLead && (
                <InfoField label="Converted From">
                  <button
                    onClick={() => router.push(`/leads/${student.originLead!.id}`)}
                    className="text-accent hover:underline"
                  >
                    {student.originLead.leadNumber}
                  </button>
                </InfoField>
              )}
            </CardContent>
          </Card>

          {student.passport?.number && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Passport</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoField label="Number">{student.passport.number}</InfoField>
                {student.passport.expiryDate && (
                  <InfoField label="Expires">
                    {format(new Date(student.passport.expiryDate), 'PPP')}
                  </InfoField>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <TransferBranchDialog
        student={student}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
      <ArchiveStudentDialog
        student={student}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
      />
      <CreateApplicationDialog
        student={student}
        open={createAppOpen}
        onOpenChange={setCreateAppOpen}
      />
      <UploadDocumentDialog
        studentId={student.id}
        studentName={studentFullName}
        open={uploadDocOpen}
        onOpenChange={setUploadDocOpen}
      />
    </div>
  );
}

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