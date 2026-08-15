'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDocuments, useDocumentStats } from '@/hooks/useDocuments';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentTable } from '@/components/documents/DocumentTable';
import {
  DocumentFilters,
  type DocumentFilterValues,
} from '@/components/documents/DocumentFilters';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { StudentPickerDialog } from '@/components/students/StudentPickerDialog';
import type { Student } from '@/lib/api/students';

export default function DocumentsPage() {
  const { has } = usePermissions();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<DocumentFilterValues>({
    search: '',
    status: '',
    documentType: '',
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data, isLoading } = useDocuments({
    page,
    limit: 20,
    search: filters.search || undefined,
    status: filters.status || undefined,
    documentType: filters.documentType || undefined,
  });

  const { data: stats } = useDocumentStats();
  const docs = data?.items ?? [];

  const canUpload = has(PERMISSION_CODES.UPLOAD_DOCUMENT);

  function handleStudentPicked(student: Student) {
    setSelectedStudent(student);
    setUploadOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Student documents and verification workflow
          </p>
        </div>
        {canUpload && (
          <Button variant="accent" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        )}
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

      {/* Student picker → then upload dialog */}
      <StudentPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleStudentPicked}
        title="Select Student"
        description="Choose the student you want to upload a document for"
      />

      {selectedStudent && (
        <UploadDocumentDialog
          studentId={selectedStudent.id}
          studentName={`${selectedStudent.personal.firstName} ${selectedStudent.personal.lastName}`}
          open={uploadOpen}
          onOpenChange={(open) => {
            setUploadOpen(open);
            if (!open) setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
}