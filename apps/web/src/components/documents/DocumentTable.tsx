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
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { formatFileSize } from '@/lib/utils/currency';
import type { DocumentEntity } from '@/lib/api/documents';
import { Files, FileText } from 'lucide-react';

interface DocumentTableProps {
  documents: DocumentEntity[];
  isLoading?: boolean;
}

export function DocumentTable({ documents, isLoading }: DocumentTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Uploaded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
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

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={Files}
          title="No documents"
          description="No documents match your filters. Upload a document from a student's page."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Doc #</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Uploaded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((d) => (
            <TableRow
              key={d.id}
              className="cursor-pointer hover:bg-secondary/50"
              onClick={() => router.push(`/documents/${d.id}`)}
            >
              <TableCell className="font-mono text-xs">{d.documentNumber}</TableCell>
              <TableCell>
                <div className="font-medium">
                  {d.student.firstName} {d.student.lastName}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {d.student.studentId}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium">{d.documentType}</div>
                <div className="text-xs text-muted-foreground">{d.documentName}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[180px]" title={d.currentVersion.file.originalName}>
                    {d.currentVersion.file.originalName}
                  </span>
                </div>
                {d.versionCount > 1 && (
                  <div className="text-xxs text-muted-foreground">
                    v{d.currentVersion.versionNumber} · {d.versionCount} versions
                  </div>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatFileSize(d.currentVersion.file.sizeBytes)}
              </TableCell>
              <TableCell>
                <DocumentStatusBadge status={d.status} />
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatDistance(new Date(d.uploadedAt), new Date(), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}