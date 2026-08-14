'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistance } from 'date-fns';
import { Users } from 'lucide-react';
import { useTeachers } from '@/hooks/useTeachers';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  VISITING: 'Visiting',
};

export default function TeachersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTeachers({ page, limit: 20 });

  const teachers = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Teachers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Teacher profiles and information
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading teachers…" />
      ) : teachers.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No teachers yet"
            description="Create a user with TEACHER role and set up their profile."
          />
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id} className="hover:bg-secondary/50">
                  <TableCell className="font-mono text-xs">{t.employeeId}</TableCell>
                  <TableCell className="font-medium">
                    {t.user.firstName} {t.user.lastName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.user.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.specialization.length > 0
                        ? t.specialization.map((s) => (
                            <Badge key={s} variant="outline" className="text-xxs">
                              {s}
                            </Badge>
                          ))
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {EMPLOYMENT_LABELS[t.employmentType] ?? t.employmentType}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.branch.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.isActive ? 'success' : 'muted'}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}