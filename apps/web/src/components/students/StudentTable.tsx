'use client';

import { useRouter } from 'next/navigation';
import { formatDistance } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { StudentStatusBadge } from './StudentStatusBadge';
import type { Student } from '@/lib/api/students';
import { GraduationCap } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  isLoading?: boolean;
}

export function StudentTable({ students, isLoading }: StudentTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Counselor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Admitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={GraduationCap}
          title="No students found"
          description="No students match your filters. Create a new student or convert from a lead."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">Student ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Counselor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Admitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow
              key={s.id}
              className="cursor-pointer hover:bg-secondary/50"
              onClick={() => router.push(`/students/${s.id}`)}
            >
              <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
              <TableCell className="font-medium">
                {s.personal.firstName} {s.personal.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">{s.contact.phone}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {s.assignedCounselor
                  ? `${s.assignedCounselor.firstName} ${s.assignedCounselor.lastName}`
                  : '—'}
              </TableCell>
              <TableCell>
                <StudentStatusBadge status={s.status} />
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatDistance(new Date(s.admissionDate), new Date(), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}