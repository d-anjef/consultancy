'use client';

import { useState } from 'react';
import { Plus , Upload } from 'lucide-react';
import { useStudents, useStudentStats } from '@/hooks/useStudents';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StudentTable } from '@/components/students/StudentTable';
import { StudentFilters, type StudentFilterValues } from '@/components/students/StudentFilters';
import { CreateStudentDialog } from '@/components/students/CreateStudentDialog';
import { BulkImportDialog } from '@/components/students/BulkImportDialog';

export default function StudentsPage() {
  const { has } = usePermissions();
  const [filters, setFilters] = useState<StudentFilterValues>({
    search: '',
    status: '',
  });
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, isLoading } = useStudents({
    page,
    limit: 20,
    search: filters.search || undefined,
    status: filters.status || undefined,
  });
  const { data: stats } = useStudentStats();

  const students = data?.items ?? [];
  const canCreate = has(PERMISSION_CODES.CREATE_STUDENT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage registered students and their profiles
          </p>
        </div>
        {canCreate && (
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => setImportOpen(true)}>
      <Upload className="h-4 w-4" />
      Bulk Import
    </Button>
    <Button variant="accent" onClick={() => setCreateOpen(true)}>
      <Plus className="h-4 w-4" />
      New Student
    </Button>
  </div>
)}
</div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.total}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Active</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.byStatus.ACTIVE ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.byStatus.COMPLETED ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Suspended
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.byStatus.SUSPENDED ?? 0}
            </p>
          </Card>
        </div>
      )}

      <StudentFilters filters={filters} onChange={setFilters} />
      <StudentTable students={students} isLoading={isLoading} />

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

      <CreateStudentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} /> 
    </div>
  );
}