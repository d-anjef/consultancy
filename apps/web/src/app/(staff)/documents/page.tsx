'use client';

import { useState } from 'react';
import { useDocuments, useDocumentStats } from '@/hooks/useDocuments';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentTable } from '@/components/documents/DocumentTable';
import {
  DocumentFilters,
  type DocumentFilterValues,
} from '@/components/documents/DocumentFilters';

export default function DocumentsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<DocumentFilterValues>({
    search: '',
    status: '',
    documentType: '',
  });

  const { data, isLoading } = useDocuments({
    page,
    limit: 20,
    search: filters.search || undefined,
    status: filters.status || undefined,
    documentType: filters.documentType || undefined,
  });

  const { data: stats } = useDocumentStats();
  const docs = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Student documents and verification workflow
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.total}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Under Review
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.byStatus.UNDER_REVIEW ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Verified
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.byStatus.VERIFIED ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Approved
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.byStatus.APPROVED ?? 0}
            </p>
          </Card>
        </div>
      )}

      <DocumentFilters filters={filters} onChange={setFilters} />
      <DocumentTable documents={docs} isLoading={isLoading} />

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination.hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}