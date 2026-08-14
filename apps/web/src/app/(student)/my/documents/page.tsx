'use client';

import { format } from 'date-fns';
import { Files, FileText, Info } from 'lucide-react';
import { useMyDocuments } from '@/hooks/useDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

export default function MyDocumentsPage() {
  const { data: documents = [], isLoading } = useMyDocuments();

  if (isLoading) {
    return <LoadingState fullPage message="Loading your documents…" />;
  }

  const statusCounts = documents.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          My Account
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Documents
        </h1>
      </div>

      {/* Info Card */}
      <Card className="border-accent/30 bg-accent-light">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-foreground">
            <p className="font-medium">Document uploads are managed by our staff.</p>
            <p className="mt-1 text-muted-foreground">
              If you need to submit or resubmit a document, please contact your assigned
              counselor.
            </p>
          </div>
        </CardContent>
      </Card>

      {documents.length === 0 ? (
        <Card>
          <EmptyState
            icon={Files}
            title="No documents yet"
            description="Your documents will appear here once uploaded by our staff."
          />
        </Card>
      ) : (
        <>
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {documents.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Under Review
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {statusCounts.UNDER_REVIEW ?? 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Approved
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-success">
                {statusCounts.APPROVED ?? 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Rejected
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">
                {(statusCounts.REJECTED ?? 0) +
                  (statusCounts.RESUBMISSION_REQUIRED ?? 0)}
              </p>
            </Card>
          </div>

          {/* Document List */}
          <div className="space-y-3">
            {documents.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-foreground">
                          {d.documentName}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {d.documentNumber} · {d.documentType}
                      </p>
                    </div>
                    <DocumentStatusBadge status={d.status} />
                  </div>

                  {(d.status === 'REJECTED' && d.rejectionReason) && (
                    <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                      <p className="font-medium text-destructive mb-1">Rejected</p>
                      <p className="text-foreground">{d.rejectionReason}</p>
                    </div>
                  )}

                  {(d.status === 'RESUBMISSION_REQUIRED' && d.resubmissionReason) && (
                    <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                      <p className="font-medium text-destructive mb-1">
                        Resubmission required
                      </p>
                      <p className="text-foreground">{d.resubmissionReason}</p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border text-xxs text-muted-foreground">
                    Uploaded {format(new Date(d.uploadedAt), 'PPP')}
                    {d.approvedAt && (
                      <span className="ml-2 text-success">
                        · Approved {format(new Date(d.approvedAt), 'PPP')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}