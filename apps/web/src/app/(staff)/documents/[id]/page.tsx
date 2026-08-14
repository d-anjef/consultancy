'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  History as HistoryIcon,
  RotateCcw,
  Upload,
  User,
} from 'lucide-react';
import {
  useDocument,
  useDocumentVersions,
  useMarkUnderReview,
  useVerifyDocument,
  useApproveDocument,
  downloadDocument,
} from '@/hooks/useDocuments';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { RejectDocumentDialog } from '@/components/documents/RejectDocumentDialog';
import { formatFileSize } from '@/lib/utils/currency';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { has } = usePermissions();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);

  const { data: doc, isLoading } = useDocument(id);
  const { data: versions = [] } = useDocumentVersions(id);

  const markReview = useMarkUnderReview(id);
  const verify = useVerifyDocument(id);
  const approve = useApproveDocument(id);

  const canReview = has(PERMISSION_CODES.REVIEW_DOCUMENT);
  const canVerify = has(PERMISSION_CODES.VERIFY_DOCUMENT);
  const canApprove = has(PERMISSION_CODES.FINAL_APPROVE_DOCUMENT);
  const canReject = has(PERMISSION_CODES.REJECT_DOCUMENT);
  const canRequestResubmit = has(PERMISSION_CODES.REQUEST_RESUBMISSION);

  if (isLoading) return <LoadingState fullPage message="Loading document…" />;

  if (!doc) {
    return (
      <EmptyState
        icon={FileText}
        title="Document not found"
        description="This document doesn't exist or you don't have permission to view it."
        action={
          <Button variant="outline" onClick={() => router.push('/documents')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
    );
  }

  async function handleDownload() {
    if (!doc) return;
    await downloadDocument(doc.id, doc.currentVersion.file.originalName);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push('/documents')}
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Documents
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {doc.documentName}
            </h1>
            <DocumentStatusBadge status={doc.status} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono">{doc.documentNumber}</span>
            <span>·</span>
            <span>{doc.documentType}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>

          {doc.status === 'SUBMITTED' && canReview && (
            <Button
              variant="outline"
              onClick={() => markReview.mutate()}
              isLoading={markReview.isPending}
            >
              <Eye className="h-4 w-4" />
              Mark Under Review
            </Button>
          )}

          {doc.status === 'UNDER_REVIEW' && canVerify && (
            <Button
              variant="outline"
              onClick={() => verify.mutate()}
              isLoading={verify.isPending}
            >
              <ShieldCheck className="h-4 w-4" />
              Verify
            </Button>
          )}

          {doc.status === 'VERIFIED' && canApprove && (
            <Button
              variant="accent"
              onClick={() => approve.mutate()}
              isLoading={approve.isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Final Approve
            </Button>
          )}

          {(doc.status === 'UNDER_REVIEW' || doc.status === 'VERIFIED') && canReject && (
            <Button
              variant="outline"
              onClick={() => setRejectOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          )}

          {['UNDER_REVIEW', 'REJECTED'].includes(doc.status) && canRequestResubmit && (
            <Button
              variant="outline"
              onClick={() => setResubmitOpen(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Request Resubmission
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Version */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Current Version
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-md border border-border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {doc.currentVersion.file.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Version {doc.currentVersion.versionNumber} ·{' '}
                    {formatFileSize(doc.currentVersion.file.sizeBytes)} ·{' '}
                    {doc.currentVersion.file.mimeType}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>

              {doc.description && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Description
                  </div>
                  <p className="text-sm text-foreground">{doc.description}</p>
                </div>
              )}

              {doc.expiryDate && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Expiry Date
                  </div>
                  <p className="text-sm text-foreground">
                    {format(new Date(doc.expiryDate), 'PPP')}
                  </p>
                </div>
              )}

              {doc.notes && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Notes
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {doc.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rejection Details */}
          {doc.status === 'REJECTED' && doc.rejectionReason && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-foreground whitespace-pre-wrap">
                  {doc.rejectionReason}
                </p>
                {doc.rejectedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Rejected on {format(new Date(doc.rejectedAt), 'PPP p')}
                    {doc.rejectedBy && (
                      <span>
                        {' '}by {doc.rejectedBy.firstName} {doc.rejectedBy.lastName}
                      </span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {doc.status === 'RESUBMISSION_REQUIRED' && doc.resubmissionReason && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <RotateCcw className="h-4 w-4" />
                  Resubmission Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-foreground whitespace-pre-wrap">
                  {doc.resubmissionReason}
                </p>
                {doc.resubmissionRequestedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Requested on{' '}
                    {format(new Date(doc.resubmissionRequestedAt), 'PPP p')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Version History */}
          {versions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4" />
                  Version History ({versions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary shrink-0">
                          <span className="text-xs font-mono font-semibold">
                            v{v.versionNumber}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {v.file.originalName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(v.file.sizeBytes)} ·{' '}
                            {v.uploadedBy?.name ?? 'Unknown'} ·{' '}
                            {format(new Date(v.uploadedAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      {v.isCurrent && (
                        <span className="text-xxs uppercase tracking-wider text-accent-foreground bg-accent-light px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Student
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <button
                onClick={() => router.push(`/students/${doc.student.id}`)}
                className="text-accent hover:underline font-medium"
              >
                {doc.student.studentId}
              </button>
              <div className="text-foreground mt-0.5">
                {doc.student.firstName} {doc.student.lastName}
              </div>
            </CardContent>
          </Card>

          {doc.application && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Application</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <button
                  onClick={() => router.push(`/applications/${doc.application!.id}`)}
                  className="text-accent hover:underline font-medium font-mono"
                >
                  {doc.application.applicationNumber}
                </button>
                <div className="text-xs text-muted-foreground mt-1">
                  Status: {doc.application.status}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                  Uploaded By
                </div>
                <div className="text-foreground">
                  {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                  Uploaded At
                </div>
                <div className="text-foreground">
                  {format(new Date(doc.uploadedAt), 'PPP p')}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                  Branch
                </div>
                <div className="text-foreground">{doc.branch.name}</div>
              </div>
            </CardContent>
          </Card>

          {(doc.verifiedBy || doc.approvedBy) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Approval Chain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {doc.reviewedBy && doc.reviewedAt && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                      Reviewed
                    </div>
                    <div className="text-foreground">
                      {doc.reviewedBy.firstName} {doc.reviewedBy.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(doc.reviewedAt), 'PPP p')}
                    </div>
                  </div>
                )}
                {doc.verifiedBy && doc.verifiedAt && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                      Verified
                    </div>
                    <div className="text-foreground">
                      {doc.verifiedBy.firstName} {doc.verifiedBy.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(doc.verifiedAt), 'PPP p')}
                    </div>
                  </div>
                )}
                {doc.approvedBy && doc.approvedAt && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                      Approved
                    </div>
                    <div className="text-foreground">
                      {doc.approvedBy.firstName} {doc.approvedBy.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(doc.approvedAt), 'PPP p')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <RejectDocumentDialog
        document={doc}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />

      <RejectDocumentDialog
        document={doc}
        open={resubmitOpen}
        onOpenChange={setResubmitOpen}
        requestResubmit
      />
    </div>
  );
}