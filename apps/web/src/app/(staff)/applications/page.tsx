'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApplications } from '@/hooks/useApplications';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ApplicationTable } from '@/components/applications/ApplicationTable';
import {
  ApplicationFilters,
  type ApplicationFilterValues,
} from '@/components/applications/ApplicationFilters';
import { CreateApplicationDialog } from '@/components/applications/CreateApplicationDialog';
import { StudentPickerDialog } from '@/components/students/StudentPickerDialog';
import type { Student } from '@/lib/api/students';

export default function ApplicationsPage() {
  const { has } = usePermissions();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ApplicationFilterValues>({
    status: '',
    programId: '',
    visaCategoryId: '',
    intakeYear: '',
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useApplications({
    page,
    limit: 20,
    status: filters.status || undefined,
    programId: filters.programId || undefined,
    visaCategoryId: filters.visaCategoryId || undefined,
    intakeYear: filters.intakeYear ? Number(filters.intakeYear) : undefined,
  });

  const apps = data?.items ?? [];
  const canCreate = has(PERMISSION_CODES.CREATE_APPLICATION);

  function handleStudentPicked(student: Student) {
    setSelectedStudent(student);
    setCreateOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Student visa & program applications
          </p>
        </div>
        {canCreate && (
          <Button variant="accent" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {apps.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Active
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {apps.filter((a) => a.isActive).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Approved
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {apps.filter((a) => a.status === 'APPROVED').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Processing
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {apps.filter((a) => a.status === 'PROCESSING').length}
          </p>
        </Card>
      </div>

      <ApplicationFilters filters={filters} onChange={setFilters} />
      <ApplicationTable applications={apps} isLoading={isLoading} />

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

      {/* Student picker → then create application dialog */}
      <StudentPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleStudentPicked}
        title="Select Student"
        description="Choose the student to create an application for"
      />

      {selectedStudent && (
        <CreateApplicationDialog
          student={selectedStudent}
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
}