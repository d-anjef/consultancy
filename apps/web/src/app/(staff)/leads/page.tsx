'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLeads, useLeadStats } from '@/hooks/useLeads';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { LeadTable } from '@/components/leads/LeadTable';
import { LeadFilters, type LeadFilterValues } from '@/components/leads/LeadFilters';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { AssignCounselorDialog } from '@/components/leads/AssignCounselorDialog';
import { LeadStatusTransitionDialog } from '@/components/leads/LeadStatusTransitionDialog';
import { Card } from '@/components/ui/card';
import type { Lead } from '@/lib/api/leads';

export default function LeadsPage() {
  const { has } = usePermissions();
  const [filters, setFilters] = useState<LeadFilterValues>({
    search: '',
    status: '',
    source: '',
  });

  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignLead, setAssignLead] = useState<Lead | null>(null);
  const [transitionLead, setTransitionLead] = useState<Lead | null>(null);

  const { data, isLoading } = useLeads({
    page,
    limit: 20,
    search: filters.search || undefined,
    status: filters.status || undefined,
    source: filters.source || undefined,
  });

  const { data: stats } = useLeadStats();

  const leads = data?.items ?? [];

  const canCreate = has(PERMISSION_CODES.CREATE_LEAD);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage prospective students and inquiries
          </p>
        </div>
        {canCreate && (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Total Leads
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.total}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              New
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.byStatus.NEW ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Qualified
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.byStatus.QUALIFIED ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Converted
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {stats.byStatus.CONVERTED ?? 0}
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <LeadFilters filters={filters} onChange={setFilters} />

      {/* Table */}
      <LeadTable leads={leads} isLoading={isLoading} />

      {/* Pagination */}
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

      {/* Dialogs */}
      <CreateLeadDialog open={createOpen} onOpenChange={setCreateOpen} />

      <AssignCounselorDialog
        lead={assignLead}
        open={!!assignLead}
        onOpenChange={(open) => !open && setAssignLead(null)}
      />

      <LeadStatusTransitionDialog
        lead={transitionLead}
        open={!!transitionLead}
        onOpenChange={(open) => !open && setTransitionLead(null)}
      />
    </div>
  );
}