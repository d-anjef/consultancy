'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Activity, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

interface AuditLog {
  id: string;
  actor: { id: string; email?: string; name?: string };
  actorRole: string;
  branch?: { id: string; code?: string; name?: string };
  action: string;
  category: string;
  entity: { type: string; id: string; displayName?: string };
  metadata: { requestId: string; ipAddress?: string };
  createdAt: string;
}

const CATEGORIES = [
  'AUTH', 'USER', 'ROLE', 'BRANCH', 'LEAD', 'COUNSELING',
  'STUDENT', 'APPLICATION', 'DOCUMENT', 'FINANCE', 'ATTENDANCE',
  'TASK', 'SYSTEM',
];

export default function AuditPage() {
  const [category, setCategory] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit', { category }],
    queryFn: () =>
      api.get<AuditLog[]>('/audit', {
        category: category || undefined,
        limit: 100,
      }),
    staleTime: 15_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete activity trail across the system
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select
          value={category || 'all'}
          onValueChange={(v) => {
            const val = v ?? '';
            setCategory(val === 'all' ? '' : val);
          }}
        >
          <SelectTrigger className="h-9 w-[180px] text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading audit logs…" />
      ) : logs.length === 0 ? (
        <Card>
          <EmptyState icon={Activity} title="No audit logs" description="No activity recorded yet." />
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Branch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-secondary/50">
                  <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), 'MMM dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">
                      {log.actor.name ?? log.actor.email ?? 'System'}
                    </div>
                    <div className="text-xxs text-muted-foreground">{log.actorRole}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono text-foreground">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xxs">
                      {log.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">
                      {log.entity.displayName ?? log.entity.type}
                    </div>
                    <div className="text-xxs text-muted-foreground font-mono truncate max-w-[150px]">
                      {log.entity.id}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.branch?.name ?? '—'}
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